-- =====================================================================
-- 001_base — Enums, configuración, usuarios, clientes, servicios, stock
-- Sistema de gestión — Peluquería
-- =====================================================================

create extension if not exists "pgcrypto";
create extension if not exists "btree_gist";

-- ---------------------------------------------------------------------
-- ENUMS (todos, aunque algunos se usen en migraciones posteriores)
-- ---------------------------------------------------------------------

create type user_role            as enum ('ADMIN', 'EMPLEADO');
create type unit_type            as enum ('G', 'ML', 'UNIDAD');
create type appointment_status   as enum ('CONFIRMADO', 'EN_CURSO', 'FINALIZADO', 'CANCELADO', 'AUSENTE');
create type appointment_origin   as enum ('PUBLICO', 'INTERNO');
create type budget_status        as enum ('PENDIENTE', 'ACEPTADO', 'RECHAZADO');
create type work_status          as enum ('DISPONIBLE', 'TOMADO', 'EN_CURSO', 'FINALIZADO', 'COBRADO', 'CANCELADO');
create type payment_method       as enum ('EFECTIVO', 'TRANSFERENCIA', 'TARJETA');
create type stock_movement_type  as enum ('ENTRADA', 'CONSUMO', 'AJUSTE', 'DEVOLUCION');
create type cash_movement_type   as enum ('INGRESO', 'EGRESO');
create type settlement_status    as enum ('PENDIENTE', 'PAGADA');
create type document_send_status as enum ('NO_ENVIADO', 'ENVIANDO', 'ENVIADO', 'ERROR');

-- ---------------------------------------------------------------------
-- Trigger genérico de updated_at
-- ---------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- profiles — un empleado es un usuario de auth.users
-- ---------------------------------------------------------------------

create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  nombre        text not null,
  apellido      text not null,
  email         text,
  telefono      text,
  rol           user_role not null default 'EMPLEADO',
  comision_pct  numeric(5,2) not null default 40
                check (comision_pct >= 0 and comision_pct <= 100),
  activo        boolean not null default true,
  fecha_alta    date not null default current_date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index profiles_rol_idx on public.profiles (rol) where activo;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Helpers para RLS. SECURITY DEFINER para que leer profiles dentro de una
-- política no dispare la política de profiles (recursión infinita).

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and rol = 'ADMIN' and activo
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and activo
  );
$$;

-- ---------------------------------------------------------------------
-- business_settings — fila única
-- ---------------------------------------------------------------------

create table public.business_settings (
  id                    smallint primary key default 1 check (id = 1),
  nombre_negocio        text not null default 'Peluquería',
  comision_default_pct  numeric(5,2) not null default 40
                        check (comision_default_pct >= 0 and comision_default_pct <= 100),
  capacidad_simultanea  smallint not null default 3 check (capacidad_simultanea > 0),
  intervalo_turnos_min  smallint not null default 30 check (intervalo_turnos_min > 0),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create trigger business_settings_updated_at
  before update on public.business_settings
  for each row execute function public.set_updated_at();

insert into public.business_settings (id) values (1);

-- ---------------------------------------------------------------------
-- business_hours — horario de atención por día de semana
-- ---------------------------------------------------------------------

create table public.business_hours (
  id             uuid primary key default gen_random_uuid(),
  dia_semana     smallint not null check (dia_semana between 0 and 6), -- 0 = domingo
  hora_apertura  time not null,
  hora_cierre    time not null,
  activo         boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint business_hours_rango_valido check (hora_cierre > hora_apertura),
  constraint business_hours_dia_unico unique (dia_semana)
);

create trigger business_hours_updated_at
  before update on public.business_hours
  for each row execute function public.set_updated_at();

-- Horario inicial de ejemplo: lunes a sábado 09:00–19:00. Editable desde el panel.
insert into public.business_hours (dia_semana, hora_apertura, hora_cierre)
values (1, '09:00', '19:00'),
       (2, '09:00', '19:00'),
       (3, '09:00', '19:00'),
       (4, '09:00', '19:00'),
       (5, '09:00', '19:00'),
       (6, '09:00', '19:00');

-- ---------------------------------------------------------------------
-- clients
-- ---------------------------------------------------------------------

create table public.clients (
  id             uuid primary key default gen_random_uuid(),
  nombre         text not null check (length(trim(nombre)) > 0),
  apellido       text not null check (length(trim(apellido)) > 0),
  dni            text,
  telefono       text not null check (length(trim(telefono)) > 0),
  telefono_norm  text generated always as (regexp_replace(telefono, '\D', '', 'g')) stored,
  email          text,
  notas          text,
  activo         boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Clave de deduplicación: el teléfono sin formato.
create unique index clients_telefono_norm_key
  on public.clients (telefono_norm)
  where telefono_norm <> '';

create index clients_nombre_idx on public.clients (lower(apellido), lower(nombre));
create index clients_email_idx  on public.clients (lower(email)) where email is not null;

create trigger clients_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- services
-- ---------------------------------------------------------------------

create table public.services (
  id           uuid primary key default gen_random_uuid(),
  nombre       text not null,
  descripcion  text,
  precio       numeric(12,2) not null check (precio >= 0),
  duracion_min integer not null check (duracion_min > 0),
  activo       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index services_activo_idx on public.services (activo);

create trigger services_updated_at
  before update on public.services
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------

create table public.products (
  id              uuid primary key default gen_random_uuid(),
  nombre          text not null,
  categoria       text,
  unidad          unit_type not null,
  cantidad_actual numeric(12,3) not null default 0,
  stock_minimo    numeric(12,3) not null default 0 check (stock_minimo >= 0),
  costo           numeric(12,2) check (costo >= 0),
  activo          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index products_bajo_stock_idx
  on public.products (nombre)
  where activo and cantidad_actual <= stock_minimo;

create trigger products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================

alter table public.profiles          enable row level security;
alter table public.business_settings enable row level security;
alter table public.business_hours    enable row level security;
alter table public.clients           enable row level security;
alter table public.services          enable row level security;
alter table public.products          enable row level security;

-- --- profiles ---------------------------------------------------------
-- Cada uno ve su propio perfil; el admin ve y administra todos.
-- Nadie ve la comisión de otro (sección 20 de la planificación).

create policy profiles_select_propio on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

create policy profiles_update_propio on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and rol = (select rol from public.profiles where id = auth.uid()));

create policy profiles_admin_all on public.profiles
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- --- business_settings ------------------------------------------------

create policy settings_select_staff on public.business_settings
  for select to authenticated using (public.is_staff());

create policy settings_update_admin on public.business_settings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- --- business_hours ---------------------------------------------------
-- Lectura pública: la página de reservas necesita saber cuándo se atiende.

create policy hours_select_public on public.business_hours
  for select to anon, authenticated using (true);

create policy hours_admin_all on public.business_hours
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- --- clients ----------------------------------------------------------
-- Empleados: leer, crear, editar. Borrar solo el admin (regla de sección 2.2).
-- El público NO lee clientes: la reserva pública crea/busca clientes
-- mediante una función SECURITY DEFINER que se agrega en la migración 002.

create policy clients_select_staff on public.clients
  for select to authenticated using (public.is_staff());

create policy clients_insert_staff on public.clients
  for insert to authenticated with check (public.is_staff());

create policy clients_update_staff on public.clients
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

create policy clients_delete_admin on public.clients
  for delete to authenticated using (public.is_admin());

-- --- services ---------------------------------------------------------
-- Lectura pública solo de servicios activos (catálogo de la reserva).

create policy services_select_public on public.services
  for select to anon using (activo);

create policy services_select_staff on public.services
  for select to authenticated using (public.is_staff());

create policy services_admin_all on public.services
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- --- products ---------------------------------------------------------
-- Empleados pueden ver y modificar stock. Alta y baja, solo admin.

create policy products_select_staff on public.products
  for select to authenticated using (public.is_staff());

create policy products_update_staff on public.products
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

create policy products_admin_all on public.products
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
