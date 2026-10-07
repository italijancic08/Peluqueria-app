-- =====================================================================
-- 015_cancelacion_reprogramacion
--   * Enlace secreto por turno para que el cliente lo gestione
--   * Quién/cuándo/por qué se canceló un turno
--   * Solicitudes de reprogramación (de cliente o de staff)
--   * Cola de notificaciones (mail / WhatsApp quedan para más adelante)
-- =====================================================================

-- ---------------------------------------------------------------------
-- Turnos: token de gestión y datos de cancelación
-- ---------------------------------------------------------------------

alter table public.appointments
  add column token_gestion text not null
    default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  add column cancelado_por text
    check (cancelado_por in ('CLIENTE', 'STAFF', 'SISTEMA')),
  add column motivo_cancelacion text,
  add column cancelado_at timestamptz,
  add column cancelado_por_profile_id uuid
    references public.profiles (id) on delete set null;

create unique index appointments_token_gestion_key
  on public.appointments (token_gestion);

-- ---------------------------------------------------------------------
-- Configuración: anticipación mínima para que el cliente modifique
-- ---------------------------------------------------------------------

alter table public.business_settings
  add column anticipacion_cliente_horas smallint not null default 2
    check (anticipacion_cliente_horas >= 0);

comment on column public.business_settings.anticipacion_cliente_horas is
  'Horas mínimas de anticipación para que un cliente cancele o reprograme su turno.';

-- ---------------------------------------------------------------------
-- Solicitudes de reprogramación
-- ---------------------------------------------------------------------

create table public.appointment_reschedules (
  id                          uuid primary key default gen_random_uuid(),
  appointment_id              uuid not null
                                references public.appointments (id) on delete cascade,
  solicitado_por              text not null
                                check (solicitado_por in ('CLIENTE', 'STAFF')),
  solicitado_por_profile_id   uuid
                                references public.profiles (id) on delete set null,
  fecha_hora_inicio_anterior  timestamptz not null,
  fecha_hora_inicio_propuesta timestamptz not null,
  fecha_hora_fin_propuesta    timestamptz not null,
  motivo                      text,
  estado                      text not null default 'PENDIENTE'
                                check (estado in ('PENDIENTE', 'ACEPTADA', 'RECHAZADA', 'RETIRADA')),
  respondido_por              text
                                check (respondido_por in ('CLIENTE', 'STAFF')),
  respondido_por_profile_id   uuid
                                references public.profiles (id) on delete set null,
  respuesta_motivo            text,
  respondido_at               timestamptz,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),

  constraint appointment_reschedules_rango_valido
    check (fecha_hora_fin_propuesta > fecha_hora_inicio_propuesta)
);

-- Un turno solo puede tener una solicitud pendiente a la vez.
create unique index appointment_reschedules_una_pendiente
  on public.appointment_reschedules (appointment_id)
  where estado = 'PENDIENTE';

create index appointment_reschedules_turno_idx
  on public.appointment_reschedules (appointment_id);

create trigger appointment_reschedules_updated_at
before update on public.appointment_reschedules
for each row
execute function public.set_updated_at();

alter table public.appointment_reschedules enable row level security;

create policy appointment_reschedules_staff_select
  on public.appointment_reschedules for select to authenticated
  using (public.is_staff());

create policy appointment_reschedules_staff_insert
  on public.appointment_reschedules for insert to authenticated
  with check (public.is_staff());

create policy appointment_reschedules_staff_update
  on public.appointment_reschedules for update to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- El cliente NO pasa por RLS: actúa desde Server Actions con service_role,
-- validando el token del turno en el código.

-- ---------------------------------------------------------------------
-- Cola de notificaciones (outbox)
-- ---------------------------------------------------------------------
-- Cada evento deja una fila PENDIENTE. Más adelante un worker (mail /
-- WhatsApp Business) las lee, resuelve el canal según los datos de
-- contacto del cliente y marca la fila como ENVIADA o ERROR.

create table public.notifications (
  id             uuid primary key default gen_random_uuid(),
  appointment_id uuid references public.appointments (id) on delete cascade,
  reschedule_id  uuid references public.appointment_reschedules (id) on delete set null,
  tipo           text not null,
  destinatario   text not null check (destinatario in ('CLIENTE', 'STAFF')),
  estado         text not null default 'PENDIENTE'
                   check (estado in ('PENDIENTE', 'ENVIADA', 'ERROR', 'OMITIDA')),
  payload        jsonb not null default '{}'::jsonb,
  intentos       smallint not null default 0,
  error          text,
  created_at     timestamptz not null default now(),
  enviada_at     timestamptz
);

create index notifications_pendientes_idx
  on public.notifications (created_at)
  where estado = 'PENDIENTE';

alter table public.notifications enable row level security;

create policy notifications_staff_select
  on public.notifications for select to authenticated
  using (public.is_staff());

create policy notifications_staff_insert
  on public.notifications for insert to authenticated
  with check (public.is_staff());

-- ---------------------------------------------------------------------
-- La expiración automática ahora deja constancia en el turno
-- ---------------------------------------------------------------------

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
       set estado = 'CANCELADO',
           cancelado_por = 'SISTEMA',
           motivo_cancelacion = 'El turno expiró por falta de asistencia.',
           cancelado_at = now()
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

  update public.appointment_reschedules
     set estado = 'RETIRADA', respondido_at = now()
   where appointment_id = any (v_ids)
     and estado = 'PENDIENTE';

  return array_length(v_ids, 1);
end;
$$;