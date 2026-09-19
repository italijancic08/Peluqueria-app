-- =====================================================================
-- 006_trabajos — works, consumo de stock, pagos y comisiones
-- =====================================================================

create sequence public.works_numero_seq start 1;

alter table public.appointments
  add column budget_id uuid references public.budgets (id) on delete set null;

create table public.works (
  id             uuid primary key default gen_random_uuid(),
  numero         integer not null default nextval('public.works_numero_seq'),
  client_id      uuid not null references public.clients (id) on delete restrict,
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  budget_id      uuid references public.budgets (id) on delete set null,
  profile_id     uuid references public.profiles (id) on delete set null,
  estado         work_status not null default 'DISPONIBLE',
  total          numeric(12,2) not null default 0,
  fecha_inicio   timestamptz,
  fecha_fin      timestamptz,
  cobrado_at     timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create unique index works_appointment_id_key on public.works (appointment_id);
create unique index works_numero_key on public.works (numero);
create index works_estado_idx on public.works (estado);
create index works_profile_idx on public.works (profile_id);

create trigger works_updated_at
  before update on public.works
  for each row execute function public.set_updated_at();

create table public.work_items (
  work_id         uuid not null references public.works (id) on delete cascade,
  service_id      uuid not null references public.services (id) on delete restrict,
  precio_snapshot numeric(12,2) not null,
  primary key (work_id, service_id)
);

create table public.work_products (
  id         uuid primary key default gen_random_uuid(),
  work_id    uuid not null references public.works (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  cantidad   numeric(12,3) not null check (cantidad > 0),
  created_at timestamptz not null default now()
);

create unique index work_products_unico on public.work_products (work_id, product_id);

create table public.stock_movements (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete restrict,
  tipo       stock_movement_type not null,
  cantidad   numeric(12,3) not null,
  work_id    uuid references public.works (id) on delete set null,
  motivo     text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- Regla 4: no se puede descontar dos veces el mismo producto del mismo trabajo.
create unique index stock_movements_consumo_unico
  on public.stock_movements (work_id, product_id)
  where tipo = 'CONSUMO' and work_id is not null;

create or replace function public.aplicar_movimiento_stock()
returns trigger
language plpgsql
as $$
begin
  update public.products
  set cantidad_actual = cantidad_actual + new.cantidad
  where id = new.product_id;
  return new;
end;
$$;

create trigger stock_movements_aplicar
  after insert on public.stock_movements
  for each row execute function public.aplicar_movimiento_stock();

create table public.payments (
  id         uuid primary key default gen_random_uuid(),
  work_id    uuid not null references public.works (id) on delete cascade,
  metodo     payment_method not null,
  monto      numeric(12,2) not null check (monto > 0),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.employee_commissions (
  id                  uuid primary key default gen_random_uuid(),
  work_id             uuid not null references public.works (id) on delete cascade,
  profile_id          uuid not null references public.profiles (id) on delete restrict,
  base_monto          numeric(12,2) not null,
  porcentaje_snapshot numeric(5,2) not null,
  monto               numeric(12,2) not null,
  created_at          timestamptz not null default now()
);

create unique index employee_commissions_work_key on public.employee_commissions (work_id);

-- ---------------------------------------------------------------------
-- Cobro: función atómica. Inserta los pagos, y si la suma coincide con
-- el total del trabajo, lo marca COBRADO y genera la comisión.
-- ---------------------------------------------------------------------

create or replace function public.cobrar_trabajo(p_work_id uuid, p_pagos jsonb)
returns table (cobrado boolean, total_pagado numeric)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_work         public.works%rowtype;
  v_total_pagado numeric(12,2);
  v_pago         jsonb;
  v_pct          numeric(5,2);
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

  for v_pago in select * from jsonb_array_elements(p_pagos)
  loop
    insert into public.payments (work_id, metodo, monto, created_by)
    values (
      p_work_id,
      (v_pago->>'metodo')::payment_method,
      (v_pago->>'monto')::numeric,
      auth.uid()
    );
  end loop;

  select coalesce(sum(monto), 0) into v_total_pagado
  from public.payments where work_id = p_work_id;

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

grant execute on function public.cobrar_trabajo(uuid, jsonb) to authenticated;

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------

alter table public.works enable row level security;
alter table public.work_items enable row level security;
alter table public.work_products enable row level security;
alter table public.stock_movements enable row level security;
alter table public.payments enable row level security;
alter table public.employee_commissions enable row level security;

create policy works_staff_select on public.works
  for select to authenticated using (public.is_staff());

create policy works_staff_insert on public.works
  for insert to authenticated with check (public.is_staff());

create policy works_staff_update on public.works
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

create policy work_items_staff_select on public.work_items
  for select to authenticated using (public.is_staff());

create policy work_items_staff_insert on public.work_items
  for insert to authenticated with check (public.is_staff());

create policy work_products_staff_select on public.work_products
  for select to authenticated using (public.is_staff());

create policy work_products_staff_insert on public.work_products
  for insert to authenticated with check (public.is_staff());

create policy stock_movements_staff_select on public.stock_movements
  for select to authenticated using (public.is_staff());

create policy stock_movements_staff_insert on public.stock_movements
  for insert to authenticated with check (public.is_staff());

create policy payments_staff_select on public.payments
  for select to authenticated using (public.is_staff());

-- Regla 9: nadie ve comisiones ajenas.
create policy commissions_propia_select on public.employee_commissions
  for select to authenticated using (profile_id = auth.uid() or public.is_admin());

-- fix errores
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