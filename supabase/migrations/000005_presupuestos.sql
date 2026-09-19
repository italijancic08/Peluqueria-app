-- =====================================================================
-- 005_presupuestos
-- =====================================================================

create sequence public.budgets_numero_seq start 1;

create table public.budgets (
  id             uuid primary key default gen_random_uuid(),
  numero         integer not null default nextval('public.budgets_numero_seq'),
  client_id      uuid not null references public.clients (id) on delete restrict,
  appointment_id uuid references public.appointments (id) on delete set null,
  estado         budget_status not null default 'PENDIENTE',
  total          numeric(12,2) not null default 0,
  notas          text,
  created_by     uuid references public.profiles (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create unique index budgets_numero_key on public.budgets (numero);
create index budgets_cliente_idx on public.budgets (client_id);
create index budgets_estado_idx on public.budgets (estado);

create trigger budgets_updated_at
  before update on public.budgets
  for each row execute function public.set_updated_at();

create table public.budget_items (
  budget_id       uuid not null references public.budgets (id) on delete cascade,
  service_id      uuid not null references public.services (id) on delete restrict,
  precio_snapshot numeric(12,2) not null,
  primary key (budget_id, service_id)
);

alter table public.budgets enable row level security;
alter table public.budget_items enable row level security;

create policy budgets_staff_select on public.budgets
  for select to authenticated using (public.is_staff());

create policy budgets_staff_insert on public.budgets
  for insert to authenticated with check (public.is_staff());

create policy budgets_staff_update on public.budgets
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

create policy budget_items_staff_select on public.budget_items
  for select to authenticated using (public.is_staff());

create policy budget_items_staff_insert on public.budget_items
  for insert to authenticated with check (public.is_staff());