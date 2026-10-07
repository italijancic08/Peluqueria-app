-- =====================================================================
-- 014_cierre_caja — Cierre mensual de caja y migración del efectivo físico
-- =====================================================================
-- Reglas (planificación, secciones 16 y 17):
--   * Al cerrar un mes se guarda un resumen inmutable.
--   * Solo el efectivo migra como caja física inicial del mes siguiente.
--   * Transferencias y tarjetas se informan, pero no se trasladan.
--   * Un mes cerrado no admite cambios: las correcciones van como
--     movimientos nuevos en el mes abierto.
-- Zona horaria del negocio: America/Argentina/Buenos_Aires.
-- =====================================================================

create table public.cash_closures (
  id                      uuid primary key default gen_random_uuid(),
  periodo                 date not null unique
                          check (periodo = date_trunc('month', periodo::timestamp)::date),
  saldo_inicial_efectivo  numeric(12,2) not null,
  total_ingresos          numeric(12,2) not null,
  total_egresos           numeric(12,2) not null,
  total_efectivo          numeric(12,2) not null,  -- neto del mes (ingresos - egresos)
  total_transferencias    numeric(12,2) not null,  -- neto del mes
  total_tarjetas          numeric(12,2) not null,  -- neto del mes
  caja_fisica_final       numeric(12,2) not null,  -- saldo inicial + total_efectivo
  closed_by               uuid references public.profiles (id) on delete set null,
  closed_at               timestamptz not null default now()
);

alter table public.cash_closures enable row level security;

create policy cash_closures_staff_select on public.cash_closures
  for select to authenticated using (public.is_staff());

-- Sin políticas de insert/update/delete: los cierres se crean solo con
-- cerrar_mes() y no se modifican.

-- ---------------------------------------------------------------------
-- Caja física con la que arranca un período:
-- último cierre anterior + efectivo neto de lo que pasó después.
-- Si todavía no hay cierres, suma todo el efectivo previo al período.
-- ---------------------------------------------------------------------

create or replace function public.caja_fisica_inicial(p_periodo date)
returns numeric
language plpgsql
stable
set search_path = public
as $$
declare
  v_periodo date := date_trunc('month', p_periodo::timestamp)::date;
  v_prev    public.cash_closures%rowtype;
  v_base    numeric(12,2) := 0;
  v_desde   timestamptz;
  v_hasta   timestamptz;
begin
  v_hasta := v_periodo::timestamp at time zone 'America/Argentina/Buenos_Aires';

  select * into v_prev
  from public.cash_closures
  where periodo < v_periodo
  order by periodo desc
  limit 1;

  if v_prev.id is not null then
    v_base  := v_prev.caja_fisica_final;
    v_desde := (v_prev.periodo + interval '1 month')::timestamp
               at time zone 'America/Argentina/Buenos_Aires';
  else
    v_desde := '-infinity'::timestamptz;
  end if;

  return v_base + coalesce((
    select sum(case when tipo = 'INGRESO' then monto else -monto end)
    from public.cash_movements
    where metodo = 'EFECTIVO'
      and created_at >= v_desde
      and created_at <  v_hasta
  ), 0);
end;
$$;

grant execute on function public.caja_fisica_inicial(date) to authenticated;

-- ---------------------------------------------------------------------
-- Cerrar un mes. Solo ADMIN, solo meses terminados, y siempre posterior
-- al último cierre existente.
-- ---------------------------------------------------------------------

create or replace function public.cerrar_mes(p_periodo date)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_periodo    date := date_trunc('month', p_periodo::timestamp)::date;
  v_mes_actual date := date_trunc('month', now() at time zone 'America/Argentina/Buenos_Aires')::date;
  v_ultimo     date;
  v_desde      timestamptz;
  v_hasta      timestamptz;
  v_inicial    numeric(12,2);
  v_ingresos   numeric(12,2);
  v_egresos    numeric(12,2);
  v_efectivo   numeric(12,2);
  v_transf     numeric(12,2);
  v_tarjetas   numeric(12,2);
  v_id         uuid;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede cerrar la caja';
  end if;

  if v_periodo >= v_mes_actual then
    raise exception 'Solo se puede cerrar un mes que ya terminó';
  end if;

  select max(periodo) into v_ultimo from public.cash_closures;

  if v_ultimo is not null and v_periodo <= v_ultimo then
    raise exception 'Ese mes ya está cerrado o es anterior al último cierre';
  end if;

  v_desde := v_periodo::timestamp at time zone 'America/Argentina/Buenos_Aires';
  v_hasta := (v_periodo + interval '1 month')::timestamp at time zone 'America/Argentina/Buenos_Aires';

  v_inicial := public.caja_fisica_inicial(v_periodo);

  select
    coalesce(sum(monto) filter (where tipo = 'INGRESO'), 0),
    coalesce(sum(monto) filter (where tipo = 'EGRESO'), 0),
    coalesce(sum(case when tipo = 'INGRESO' then monto else -monto end)
             filter (where metodo = 'EFECTIVO'), 0),
    coalesce(sum(case when tipo = 'INGRESO' then monto else -monto end)
             filter (where metodo = 'TRANSFERENCIA'), 0),
    coalesce(sum(case when tipo = 'INGRESO' then monto else -monto end)
             filter (where metodo in ('TARJETA', 'TARJETA_CREDITO', 'TARJETA_DEBITO')), 0)
  into v_ingresos, v_egresos, v_efectivo, v_transf, v_tarjetas
  from public.cash_movements
  where created_at >= v_desde and created_at < v_hasta;

  insert into public.cash_closures (
    periodo, saldo_inicial_efectivo, total_ingresos, total_egresos,
    total_efectivo, total_transferencias, total_tarjetas,
    caja_fisica_final, closed_by
  )
  values (
    v_periodo, v_inicial, v_ingresos, v_egresos,
    v_efectivo, v_transf, v_tarjetas,
    v_inicial + v_efectivo, auth.uid()
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.cerrar_mes(date) to authenticated;

-- ---------------------------------------------------------------------
-- Bloqueo de períodos cerrados en cash_movements.
-- Permite que los FK "on delete set null" sigan funcionando (cambian
-- created_by / payment_id / work_id, nunca los datos económicos).
-- ---------------------------------------------------------------------

create or replace function public.bloquear_periodo_cerrado()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_periodo date;
begin
  if tg_op in ('UPDATE', 'DELETE') then
    v_periodo := date_trunc('month', old.created_at at time zone 'America/Argentina/Buenos_Aires')::date;

    if exists (select 1 from public.cash_closures where periodo = v_periodo) then
      if tg_op = 'DELETE'
         or old.tipo is distinct from new.tipo
         or old.metodo is distinct from new.metodo
         or old.monto is distinct from new.monto
         or old.descripcion is distinct from new.descripcion
         or old.created_at is distinct from new.created_at then
        raise exception 'El mes % ya está cerrado. Registrá la corrección como un movimiento nuevo.',
          to_char(v_periodo, 'MM/YYYY');
      end if;
    end if;
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    v_periodo := date_trunc('month', new.created_at at time zone 'America/Argentina/Buenos_Aires')::date;

    if exists (select 1 from public.cash_closures where periodo = v_periodo) then
      raise exception 'El mes % ya está cerrado. No se pueden agregar movimientos.',
        to_char(v_periodo, 'MM/YYYY');
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger cash_movements_periodo_cerrado
  before insert or update or delete on public.cash_movements
  for each row execute function public.bloquear_periodo_cerrado();

-- ---------------------------------------------------------------------
-- Edición de movimientos manuales: solo ADMIN, nunca los que vienen de
-- un cobro. (Hasta ahora faltaba esta política y el "Editar" no hacía nada.)
-- ---------------------------------------------------------------------

create policy cash_movements_admin_update on public.cash_movements
  for update to authenticated
  using (public.is_admin() and work_id is null and payment_id is null)
  with check (public.is_admin() and work_id is null and payment_id is null);