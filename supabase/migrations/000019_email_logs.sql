create table public.email_logs (
  id               uuid primary key default gen_random_uuid(),
  tipo             text not null
                     check (tipo in (
                       'COMPROBANTE',
                       'PRESUPUESTO',
                       'TURNO_CANCELADO',
                       'REPROGRAMACION_PROPUESTA',
                       'REPROGRAMACION_SOLICITADA',
                       'REPROGRAMACION_CONFIRMADA',
                       'REPROGRAMACION_RECHAZADA'
                     )),
  estado           text not null
                     check (estado in ('ENVIADO', 'FALLIDO')),
  motivo           text,
  client_id        uuid references public.clients (id) on delete set null,
  cliente_nombre   text,
  email_destino    text,
  asunto           text,
  referencia       text,
  appointment_id   uuid references public.appointments (id) on delete set null,
  work_id          uuid references public.works (id) on delete set null,
  budget_id        uuid references public.budgets (id) on delete set null,
  resend_id        text,
  created_at       timestamptz not null default now()
);

create index email_logs_created_idx on public.email_logs (created_at desc);
create index email_logs_estado_idx  on public.email_logs (estado, created_at desc);

alter table public.email_logs enable row level security;

create policy email_logs_admin_select
  on public.email_logs for select to authenticated
  using (public.is_admin());