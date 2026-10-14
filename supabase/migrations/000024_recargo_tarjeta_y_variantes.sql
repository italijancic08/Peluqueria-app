-- =====================================================================
-- 024_recargo_tarjeta_y_variantes
--  * Recargo de tarjeta configurable: el precio con tarjeta se calcula
--    a partir del precio en efectivo/transferencia (+ recargo %).
--  * Variantes de servicio, cada una con su precio y duración.
--  * Turnos, trabajos y presupuestos guardan la variante elegida.
-- =====================================================================

alter table public.business_settings
  add column if not exists recargo_tarjeta_pct numeric(5,2) not null default 40
  check (recargo_tarjeta_pct >= 0 and recargo_tarjeta_pct <= 300);

comment on column public.business_settings.recargo_tarjeta_pct is
  'Porcentaje que se suma al precio en efectivo/transferencia cuando se paga con tarjeta.';

create table public.service_variants (
  id           uuid primary key default gen_random_uuid(),
  service_id   uuid not null references public.services (id) on delete cascade,
  nombre       text not null check (length(trim(nombre)) > 0),
  precio       numeric(12,2) not null check (precio >= 0),
  duracion_min integer not null check (duracion_min > 0),
  activo       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index service_variants_service_idx on public.service_variants (service_id);

-- No puede haber dos variantes activas con el mismo nombre en un servicio.
create unique index service_variants_nombre_key
  on public.service_variants (service_id, lower(nombre))
  where activo;

create trigger service_variants_updated_at
  before update on public.service_variants
  for each row execute function public.set_updated_at();

alter table public.service_variants enable row level security;

-- Igual que services: la reserva pública ve solo las activas.
create policy service_variants_select_public on public.service_variants
  for select to anon using (activo);

create policy service_variants_select_staff on public.service_variants
  for select to authenticated using (public.is_staff());

create policy service_variants_admin_all on public.service_variants
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Variante elegida (y su nombre, por si luego se desactiva o renombra).
alter table public.appointment_services
  add column if not exists variant_id uuid references public.service_variants (id) on delete set null,
  add column if not exists variante_nombre text;

alter table public.work_items
  add column if not exists variant_id uuid references public.service_variants (id) on delete set null,
  add column if not exists variante_nombre text;

alter table public.budget_items
  add column if not exists variant_id uuid references public.service_variants (id) on delete set null,
  add column if not exists variante_nombre text;