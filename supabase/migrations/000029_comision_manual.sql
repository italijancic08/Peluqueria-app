-- =====================================================================
-- 029_comision_manual
--   Permite cargar comisiones que no vienen de un trabajo cobrado.
--   El % sale del empleado (profiles.comision_pct) y el monto se calcula acá.
-- =====================================================================

alter table public.employee_commissions
  alter column work_id drop not null;

alter table public.employee_commissions
  add column es_manual boolean not null default false,
  add column descripcion text;

create or replace function public.crear_comision_manual(
  p_profile_id  uuid,
  p_base_monto  numeric,
  p_descripcion text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pct numeric(5,2);
  v_id  uuid;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede cargar comisiones manuales';
  end if;

  if p_base_monto is null or p_base_monto <= 0 then
    raise exception 'El total del trabajo tiene que ser mayor a 0';
  end if;

  select comision_pct into v_pct
  from public.profiles
  where id = p_profile_id and activo = true;

  if v_pct is null then
    raise exception 'Empleado no encontrado o inactivo';
  end if;

  insert into public.employee_commissions
    (work_id, profile_id, base_monto, porcentaje_snapshot, monto, es_manual, descripcion)
  values
    (null, p_profile_id, p_base_monto, v_pct, round(p_base_monto * v_pct / 100, 2), true, nullif(trim(p_descripcion), ''))
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.crear_comision_manual(uuid, numeric, text) to authenticated;