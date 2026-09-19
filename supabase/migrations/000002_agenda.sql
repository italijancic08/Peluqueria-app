-- =====================================================================
-- 002_agenda — Horarios bloqueados, turnos y funciones públicas de disponibilidad
-- =====================================================================

create sequence public.appointments_numero_seq
  start 1;


-- =====================================================================
-- HORARIOS BLOQUEADOS
-- =====================================================================

create table public.schedule_blocks (
  id           uuid primary key default gen_random_uuid(),
  fecha_inicio timestamptz not null,
  fecha_fin    timestamptz not null,
  motivo       text,
  profile_id   uuid references public.profiles (id) on delete cascade,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint schedule_blocks_rango_valido
    check (fecha_fin > fecha_inicio)
);


create index schedule_blocks_rango_idx
on public.schedule_blocks
using gist (
  tstzrange(fecha_inicio, fecha_fin)
);


create trigger schedule_blocks_updated_at
before update on public.schedule_blocks
for each row
execute function public.set_updated_at();


-- =====================================================================
-- TURNOS / APPOINTMENTS
-- =====================================================================

create table public.appointments (
  id                 uuid primary key default gen_random_uuid(),
  numero             integer not null default nextval('public.appointments_numero_seq'),
  client_id          uuid not null references public.clients (id) on delete restrict,
  profile_id         uuid references public.profiles (id) on delete set null,
  fecha_hora_inicio  timestamptz not null,
  fecha_hora_fin     timestamptz not null,
  duracion_min       integer not null check (duracion_min > 0),
  estado             appointment_status not null default 'CONFIRMADO',
  comentario_cliente text,
  origen             appointment_origin not null default 'INTERNO',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  constraint appointments_rango_valido
    check (fecha_hora_fin > fecha_hora_inicio)
);


create index appointments_fecha_idx
on public.appointments (fecha_hora_inicio);


create index appointments_cliente_idx
on public.appointments (client_id);


create unique index appointments_numero_key
on public.appointments (numero);


-- =====================================================================
-- REGLAS DE SOLAPAMIENTO
-- =====================================================================
--
-- Un empleado no puede tener dos turnos superpuestos.
--
-- Si alguno de los turnos está CANCELADO, se permite el solapamiento.
--
-- tstzrange se utiliza porque fecha_hora_inicio y fecha_hora_fin
-- son columnas timestamptz.
-- =====================================================================

alter table public.appointments
  add constraint appointments_sin_solapamiento
  exclude using gist (
    profile_id with =,
    tstzrange(fecha_hora_inicio, fecha_hora_fin) with &&
  )
  where (
    profile_id is not null
    and estado <> 'CANCELADO'
  );


create trigger appointments_updated_at
before update on public.appointments
for each row
execute function public.set_updated_at();


-- =====================================================================
-- SERVICIOS DE CADA TURNO
-- =====================================================================

create table public.appointment_services (
  appointment_id    uuid not null references public.appointments (id) on delete cascade,
  service_id        uuid not null references public.services (id) on delete restrict,
  precio_snapshot   numeric(12,2) not null,
  duracion_snapshot integer not null,

  primary key (appointment_id, service_id)
);


-- =====================================================================
-- FUNCIONES PÚBLICAS DE SOLO LECTURA
-- =====================================================================
--
-- Estas funciones permiten consultar disponibilidad sin exponer
-- información de clientes.
--
-- Solo devuelven horarios y profile_id.
-- =====================================================================


-- ---------------------------------------------------------------------
-- Turnos ocupados de un día
-- ---------------------------------------------------------------------

create or replace function public.turnos_ocupados_dia(
  p_fecha date
)
returns table (
  fecha_hora_inicio timestamptz,
  fecha_hora_fin    timestamptz,
  profile_id        uuid
)
language sql
stable
security definer
set search_path = public
as $$
  select
    fecha_hora_inicio,
    fecha_hora_fin,
    profile_id
  from public.appointments
  where estado not in ('CANCELADO', 'AUSENTE')
    and (
      fecha_hora_inicio
      at time zone 'America/Argentina/Buenos_Aires'
    )::date = p_fecha;
$$;


grant execute
on function public.turnos_ocupados_dia(date)
to anon, authenticated;


-- ---------------------------------------------------------------------
-- Bloqueos de un día
-- ---------------------------------------------------------------------

create or replace function public.bloqueos_dia(
  p_fecha date
)
returns table (
  fecha_inicio timestamptz,
  fecha_fin    timestamptz,
  profile_id   uuid
)
language sql
stable
security definer
set search_path = public
as $$
  select
    fecha_inicio,
    fecha_fin,
    profile_id
  from public.schedule_blocks
  where (
    fecha_inicio
    at time zone 'America/Argentina/Buenos_Aires'
  )::date <= p_fecha

    and (
      fecha_fin
      at time zone 'America/Argentina/Buenos_Aires'
    )::date >= p_fecha;
$$;


grant execute
on function public.bloqueos_dia(date)
to anon, authenticated;


-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================

alter table public.schedule_blocks
enable row level security;


alter table public.appointments
enable row level security;


alter table public.appointment_services
enable row level security;


-- =====================================================================
-- POLÍTICAS: SCHEDULE BLOCKS
-- =====================================================================

create policy schedule_blocks_staff_select
on public.schedule_blocks
for select
to authenticated
using (
  public.is_staff()
);


create policy schedule_blocks_admin_all
on public.schedule_blocks
for all
to authenticated
using (
  public.is_admin()
)
with check (
  public.is_admin()
);


-- =====================================================================
-- POLÍTICAS: APPOINTMENTS
-- =====================================================================

create policy appointments_staff_select
on public.appointments
for select
to authenticated
using (
  public.is_staff()
);


create policy appointments_staff_insert
on public.appointments
for insert
to authenticated
with check (
  public.is_staff()
);


create policy appointments_staff_update
on public.appointments
for update
to authenticated
using (
  public.is_staff()
)
with check (
  public.is_staff()
);


-- =====================================================================
-- POLÍTICAS: APPOINTMENT SERVICES
-- =====================================================================

create policy appointment_services_staff_select
on public.appointment_services
for select
to authenticated
using (
  public.is_staff()
);


create policy appointment_services_staff_insert
on public.appointment_services
for insert
to authenticated
with check (
  public.is_staff()
);


-- =====================================================================
-- RESERVA PÚBLICA
-- =====================================================================
--
-- La reserva pública NO pasa por estas políticas RLS.
--
-- Se realiza desde una Server Action utilizando la clave service_role,
-- validando previamente los datos y la disponibilidad en el código.
-- =====================================================================