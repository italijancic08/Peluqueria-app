alter type payment_method add value if not exists 'CUENTA_CORRIENTE';

create type account_movement_type as enum ('DEBITO', 'CREDITO');

alter table public.clients
  add column if not exists cuenta_corriente_habilitada boolean not null default false;

alter table public.services
  add column if not exists tiene_ficha_tecnica boolean not null default false;

alter table public.work_items
  add column if not exists ficha_tecnica text;

create table public.account_movements (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.clients (id) on delete restrict,
  work_id     uuid references public.works (id) on delete set null,
  tipo        account_movement_type not null,
  monto       numeric(12,2) not null check (monto > 0),
  metodo      payment_method,
  descripcion text,
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);

create index account_movements_cliente_idx on public.account_movements (client_id);

alter table public.account_movements enable row level security;

create policy account_movements_staff_select on public.account_movements
  for select to authenticated using (public.is_staff());

create policy account_movements_staff_insert on public.account_movements
  for insert to authenticated with check (public.is_staff());

-- Sin políticas de update/delete: igual que cash_closures, un error se corrige
-- con un movimiento nuevo, no editando el historial.

create or replace function public.registrar_pago_cuenta_corriente(
  p_client_id uuid,
  p_monto numeric,
  p_metodo payment_method,
  p_descripcion text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_saldo numeric(12,2);
begin
  if not public.is_staff() then
    raise exception 'No autorizado';
  end if;

  if p_metodo = 'CUENTA_CORRIENTE' then
    raise exception 'Elegí un medio de pago real para saldar la cuenta corriente';
  end if;

  select coalesce(sum(case when tipo = 'DEBITO' then monto else -monto end), 0)
  into v_saldo
  from public.account_movements
  where client_id = p_client_id;

  if p_monto > v_saldo then
    raise exception 'El pago supera la deuda actual (%).', v_saldo;
  end if;

  insert into public.account_movements (client_id, tipo, monto, metodo, descripcion, created_by)
  values (p_client_id, 'CREDITO', p_monto, p_metodo, coalesce(nullif(p_descripcion, ''), 'Pago de cuenta corriente'), auth.uid());

  insert into public.cash_movements (tipo, metodo, monto, created_by, descripcion)
  select
    'INGRESO', p_metodo, p_monto, auth.uid(),
    'Pago cuenta corriente — ' || nombre || ' ' || apellido
  from public.clients where id = p_client_id;
end;
$$;

grant execute on function public.registrar_pago_cuenta_corriente(uuid, numeric, payment_method, text) to authenticated;

create or replace function public.cobrar_trabajo(p_work_id uuid, p_pagos jsonb)
returns table (cobrado boolean, total_pagado numeric)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_work           public.works%rowtype;
  v_ya_pagado      numeric(12,2);
  v_nuevo_pago     numeric(12,2);
  v_total_pagado   numeric(12,2);
  v_pago           jsonb;
  v_pct            numeric(5,2);
  v_payment_id     uuid;
  v_nombre_cliente text;
  v_metodo         payment_method;
  v_monto          numeric(12,2);
  v_cc_habilitada  boolean;
begin
  if not public.is_staff() then
    raise exception 'No autorizado';
  end if;

  select * into v_work from public.works where id = p_work_id for update;

  if v_work.id is null then
    raise exception 'Trabajo no encontrado';
  end if;

  if v_work.estado = 'COBRADO' then
    raise exception 'Este trabajo ya fue cobrado';
  end if;

  if v_work.estado <> 'FINALIZADO' then
    raise exception 'El trabajo todavía no está finalizado';
  end if;

  select coalesce(sum(monto), 0) into v_ya_pagado
  from public.payments where work_id = p_work_id;

  select coalesce(sum((p->>'monto')::numeric), 0) into v_nuevo_pago
  from jsonb_array_elements(p_pagos) p;

  if v_ya_pagado + v_nuevo_pago > v_work.total then
    raise exception 'El monto ingresado supera el saldo pendiente. Faltan solo %', (v_work.total - v_ya_pagado);
  end if;

  select nombre || ' ' || apellido, cuenta_corriente_habilitada
  into v_nombre_cliente, v_cc_habilitada
  from public.clients where id = v_work.client_id;

  for v_pago in select * from jsonb_array_elements(p_pagos)
  loop
    v_metodo := (v_pago->>'metodo')::payment_method;
    v_monto := (v_pago->>'monto')::numeric;

    if v_metodo = 'CUENTA_CORRIENTE' and not coalesce(v_cc_habilitada, false) then
      raise exception 'Este cliente no tiene cuenta corriente habilitada';
    end if;

    insert into public.payments (work_id, metodo, monto, cuotas, created_by)
    values (
      p_work_id,
      v_metodo,
      v_monto,
      nullif(v_pago->>'cuotas', '')::smallint,
      auth.uid()
    )
    returning id into v_payment_id;

    if v_metodo = 'CUENTA_CORRIENTE' then
      insert into public.account_movements (client_id, tipo, monto, work_id, descripcion, created_by)
      values (v_work.client_id, 'DEBITO', v_monto, p_work_id, 'Cargo trabajo #' || v_work.numero, auth.uid());
    else
      insert into public.cash_movements (tipo, metodo, monto, payment_id, work_id, created_by, descripcion)
      values ('INGRESO', v_metodo, v_monto, v_payment_id, p_work_id, auth.uid(), 'Cobro a ' || coalesce(v_nombre_cliente, 'cliente'));
    end if;
  end loop;

  v_total_pagado := v_ya_pagado + v_nuevo_pago;

  if v_total_pagado = v_work.total then
    update public.works
    set estado = 'COBRADO', cobrado_at = now()
    where id = p_work_id;

    if v_work.profile_id is not null then
      select coalesce(comision_pct, (select comision_default_pct from public.business_settings where id = 1))
      into v_pct
      from public.profiles where id = v_work.profile_id;

      insert into public.employee_commissions (work_id, profile_id, base_monto, porcentaje_snapshot, monto)
      values (p_work_id, v_work.profile_id, v_work.total, v_pct, round(v_work.total * v_pct / 100, 2))
      on conflict (work_id) do nothing;
    end if;

    return query select true, v_total_pagado;
  else
    return query select false, v_total_pagado;
  end if;
end;
$$;