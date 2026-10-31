-- =====================================================================
-- 030_liquidar_pendientes
--   liquidar_semana ahora liquida TODAS las comisiones pendientes del
--   empleado (coincide con lo que muestra la pantalla), y el rango de
--   fechas de la liquidación se amplía para cubrirlas.
--   Se quita la restricción unique (profile_id, semana_inicio) para
--   permitir más de una liquidación en la misma semana.
-- =====================================================================

alter table public.employee_settlements
  drop constraint if exists employee_settlements_unico;

create or replace function public.liquidar_semana(
  p_profile_id    uuid,
  p_semana_inicio date,
  p_semana_fin    date
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total       numeric(12,2);
  v_cantidad    integer;
  v_desde       date;
  v_hasta       date;
  v_settlement  uuid;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede liquidar comisiones';
  end if;

  select
    coalesce(sum(c.monto), 0),
    count(*),
    min(c.fecha),
    max(c.fecha)
  into v_total, v_cantidad, v_desde, v_hasta
  from (
    select
      monto,
      (created_at at time zone 'America/Argentina/Buenos_Aires')::date as fecha
    from public.employee_commissions
    where profile_id = p_profile_id
      and settlement_id is null
  ) c;

  if v_cantidad = 0 then
    raise exception 'No hay comisiones pendientes para liquidar';
  end if;

  insert into public.employee_settlements (profile_id, semana_inicio, semana_fin, total)
  values (
    p_profile_id,
    least(p_semana_inicio, v_desde),
    greatest(p_semana_fin, v_hasta),
    v_total
  )
  returning id into v_settlement;

  update public.employee_commissions
  set settlement_id = v_settlement
  where profile_id = p_profile_id
    and settlement_id is null;

  return v_settlement;
end;
$$;

grant execute on function public.liquidar_semana(uuid, date, date) to authenticated;