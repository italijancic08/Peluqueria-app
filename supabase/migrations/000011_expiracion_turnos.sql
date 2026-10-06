-- =====================================================================
-- 011_expiracion_turnos — Expiración automática de turnos sin asistencia
-- =====================================================================
--
-- Un turno "expira" cuando:
--   * la opción está activada en configuración,
--   * el turno sigue CONFIRMADO,
--   * su trabajo sigue DISPONIBLE (nadie lo tomó), y
--   * ya pasaron `expiracion_turno_min` minutos desde su hora de inicio.
--
-- En ese caso el turno y su trabajo pasan a CANCELADO.
-- =====================================================================

alter table public.business_settings
  add column turnos_expiran boolean not null default false,
  add column expiracion_turno_min smallint not null default 30
    check (expiracion_turno_min > 0);

comment on column public.business_settings.turnos_expiran is
  'Si es true, los turnos sin asistencia se cancelan solos al pasar el tiempo máximo.';
comment on column public.business_settings.expiracion_turno_min is
  'Minutos de espera, contados desde la hora de inicio del turno, antes de cancelarlo.';

create or replace function public.expirar_turnos_vencidos()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_activa boolean;
  v_min    smallint;
  v_ids    uuid[];
begin
  select turnos_expiran, expiracion_turno_min
    into v_activa, v_min
    from public.business_settings
   where id = 1;

  if not coalesce(v_activa, false) then
    return 0;
  end if;

  with vencidos as (
    update public.appointments a
       set estado = 'CANCELADO'
     where a.estado = 'CONFIRMADO'
       and a.fecha_hora_inicio + make_interval(mins => v_min) < now()
       and exists (
         select 1
           from public.works w
          where w.appointment_id = a.id
            and w.estado = 'DISPONIBLE'
       )
    returning a.id
  )
  select array_agg(id) into v_ids from vencidos;

  if v_ids is null then
    return 0;
  end if;

  update public.works
     set estado = 'CANCELADO'
   where appointment_id = any (v_ids)
     and estado = 'DISPONIBLE';

  return array_length(v_ids, 1);
end;
$$;

revoke all on function public.expirar_turnos_vencidos() from public, anon;
grant execute on function public.expirar_turnos_vencidos() to authenticated;

select cron.schedule(
  'expirar-turnos',
  '*/5 * * * *',
  $$ select public.expirar_turnos_vencidos(); $$
);