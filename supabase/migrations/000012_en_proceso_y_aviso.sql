-- =====================================================================
-- 012_en_proceso_y_aviso — "Tomado" solo asigna quién atiende; el cliente
-- llega cuando el trabajo pasa a EN_CURSO ("En proceso").
-- =====================================================================
--
-- 1) Aviso de turnos sin tomar: minutos antes del turno a partir de los
--    cuales se resalta un turno que todavía no tiene empleado asignado.
-- 2) La expiración ahora cancela los turnos cuyo trabajo sigue DISPONIBLE
--    o TOMADO (el cliente no llegó, nadie lo inició). Un trabajo
--    EN_CURSO, FINALIZADO o COBRADO nunca expira.
-- =====================================================================

alter table public.business_settings
  add column aviso_sin_tomar_min smallint not null default 60
    check (aviso_sin_tomar_min > 0);

comment on column public.business_settings.aviso_sin_tomar_min is
  'Minutos antes del turno desde los cuales se avisa que nadie lo tomó.';

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
            and w.estado in ('DISPONIBLE', 'TOMADO')
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
     and estado in ('DISPONIBLE', 'TOMADO');

  return array_length(v_ids, 1);
end;
$$;

revoke all on function public.expirar_turnos_vencidos() from public, anon;
grant execute on function public.expirar_turnos_vencidos() to authenticated;