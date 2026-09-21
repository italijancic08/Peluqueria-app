-- =====================================================================
-- 007_caja_liquidaciones
-- =====================================================================

create table public.cash_movements (
  id          uuid primary key default gen_random_uuid(),
  tipo        cash_movement_type not null,
  metodo      payment_method not null,
  monto       numeric(12,2) not null check (monto > 0),
  descripcion text,
  payment_id  uuid references public.payments (id) on delete set null,
  work_id     uuid references public.works (id) on delete set null,
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);

create index cash_movements_fecha_idx on public.cash_movements (created_at);
create index cash_movements_metodo_idx on public.cash_movements (metodo);

alter table public.cash_movements enable row level security;

create policy cash_movements_staff_select on public.cash_movements
  for select to authenticated using (public.is_staff());

create policy cash_movements_staff_insert on public.cash_movements
  for insert to authenticated with check (public.is_staff());

-- ---------------------------------------------------------------------
-- Se actualiza cobrar_trabajo para que cada pago genere también
-- su movimiento de caja (regla: todo cobro entra a caja automático).
-- ---------------------------------------------------------------------

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

  for v_pago in select * from jsonb_array_elements(p_pagos)
  loop
    insert into public.payments (work_id, metodo, monto, created_by)
    values (
      p_work_id,
      (v_pago->>'metodo')::payment_method,
      (v_pago->>'monto')::numeric,
      auth.uid()
    )
    returning id into v_payment_id;

    insert into public.cash_movements (tipo, metodo, monto, payment_id, work_id, created_by, descripcion)
    values (
      'INGRESO',
      (v_pago->>'metodo')::payment_method,
      (v_pago->>'monto')::numeric,
      v_payment_id,
      p_work_id,
      auth.uid(),
      'Cobro trabajo #' || v_work.numero
    );
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

-- ---------------------------------------------------------------------
-- Liquidaciones
-- ---------------------------------------------------------------------

create table public.employee_settlements (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null references public.profiles (id) on delete restrict,
  semana_inicio date not null,
  semana_fin    date not null,
  total         numeric(12,2) not null,
  estado        settlement_status not null default 'PENDIENTE',
  fecha_pago    timestamptz,
  paid_by       uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  constraint employee_settlements_unico unique (profile_id, semana_inicio)
);

alter table public.employee_commissions
  add column settlement_id uuid references public.employee_settlements (id) on delete set null;

alter table public.employee_settlements enable row level security;

create policy settlements_propia_select on public.employee_settlements
  for select to authenticated using (profile_id = auth.uid() or public.is_admin());

create policy settlements_admin_all on public.employee_settlements
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Junta las comisiones no liquidadas de un empleado en una semana y las cierra.
create or replace function public.liquidar_semana(
  p_profile_id uuid,
  p_semana_inicio date,
  p_semana_fin date
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total       numeric(12,2);
  v_settlement  uuid;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede liquidar comisiones';
  end if;

  select coalesce(sum(monto), 0) into v_total
  from public.employee_commissions
  where profile_id = p_profile_id
    and settlement_id is null
    and (created_at at time zone 'America/Argentina/Buenos_Aires')::date between p_semana_inicio and p_semana_fin;

  if v_total = 0 then
    raise exception 'No hay comisiones pendientes para esta semana';
  end if;

  insert into public.employee_settlements (profile_id, semana_inicio, semana_fin, total)
  values (p_profile_id, p_semana_inicio, p_semana_fin, v_total)
  returning id into v_settlement;

  update public.employee_commissions
  set settlement_id = v_settlement
  where profile_id = p_profile_id
    and settlement_id is null
    and (created_at at time zone 'America/Argentina/Buenos_Aires')::date between p_semana_inicio and p_semana_fin;

  return v_settlement;
end;
$$;

grant execute on function public.liquidar_semana(uuid, date, date) to authenticated;

create or replace function public.marcar_liquidacion_pagada(p_settlement_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede marcar liquidaciones como pagadas';
  end if;

  update public.employee_settlements
  set estado = 'PAGADA', fecha_pago = now(), paid_by = auth.uid()
  where id = p_settlement_id and estado = 'PENDIENTE';
end;
$$;

grant execute on function public.marcar_liquidacion_pagada(uuid) to authenticated;

-- cambio en cobrar trabajo:

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

  select apellido || ', ' || nombre into v_nombre_cliente
  from public.clients where id = v_work.client_id;

  for v_pago in select * from jsonb_array_elements(p_pagos)
  loop
    insert into public.payments (work_id, metodo, monto, created_by)
    values (
      p_work_id,
      (v_pago->>'metodo')::payment_method,
      (v_pago->>'monto')::numeric,
      auth.uid()
    )
    returning id into v_payment_id;

    insert into public.cash_movements (tipo, metodo, monto, payment_id, work_id, created_by, descripcion)
    values (
      'INGRESO',
      (v_pago->>'metodo')::payment_method,
      (v_pago->>'monto')::numeric,
      v_payment_id,
      p_work_id,
      auth.uid(),
      'Cobro a ' || coalesce(v_nombre_cliente, 'cliente')
    );
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

-- Cambio en la disposicion del nombre y apellido

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

  select nombre || ' ' || apellido into v_nombre_cliente
  from public.clients where id = v_work.client_id;

  for v_pago in select * from jsonb_array_elements(p_pagos)
  loop
    insert into public.payments (work_id, metodo, monto, created_by)
    values (
      p_work_id,
      (v_pago->>'metodo')::payment_method,
      (v_pago->>'monto')::numeric,
      auth.uid()
    )
    returning id into v_payment_id;

    insert into public.cash_movements (tipo, metodo, monto, payment_id, work_id, created_by, descripcion)
    values (
      'INGRESO',
      (v_pago->>'metodo')::payment_method,
      (v_pago->>'monto')::numeric,
      v_payment_id,
      p_work_id,
      auth.uid(),
      'Cobro a ' || coalesce(v_nombre_cliente, 'cliente')
    );
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