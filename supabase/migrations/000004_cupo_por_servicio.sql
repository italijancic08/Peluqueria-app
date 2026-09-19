-- =====================================================================
-- 004_cupo_por_servicio — Límite de turnos simultáneos por servicio
-- =====================================================================

alter table public.services
  add column cupo_maximo smallint check (cupo_maximo is null or cupo_maximo > 0);

comment on column public.services.cupo_maximo is
  'Máximo de turnos simultáneos que pueden incluir este servicio. NULL = usa la capacidad general del negocio.';

-- Se reemplaza la función: ahora también devuelve qué servicios tiene
-- cada turno, para poder calcular el cupo por servicio.
drop function if exists public.turnos_ocupados_dia(date);

create function public.turnos_ocupados_dia(p_fecha date)
returns table (
  fecha_hora_inicio timestamptz,
  fecha_hora_fin    timestamptz,
  profile_id        uuid,
  servicio_ids      uuid[]
)
language sql
stable
security definer
set search_path = public
as $$
  select
    a.fecha_hora_inicio,
    a.fecha_hora_fin,
    a.profile_id,
    coalesce(array_agg(aps.service_id) filter (where aps.service_id is not null), '{}')
  from public.appointments a
  left join public.appointment_services aps on aps.appointment_id = a.id
  where a.estado not in ('CANCELADO', 'AUSENTE')
    and (a.fecha_hora_inicio at time zone 'America/Argentina/Buenos_Aires')::date = p_fecha
  group by a.id, a.fecha_hora_inicio, a.fecha_hora_fin, a.profile_id;
$$;

grant execute on function public.turnos_ocupados_dia(date) to anon, authenticated;