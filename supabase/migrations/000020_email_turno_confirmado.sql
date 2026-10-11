-- 020_email_turno_confirmado
-- Permite registrar en email_logs los mails de "turno confirmado".

alter table public.email_logs
  drop constraint if exists email_logs_tipo_check;

alter table public.email_logs
  add constraint email_logs_tipo_check
  check (tipo in (
    'COMPROBANTE',
    'PRESUPUESTO',
    'TURNO_CONFIRMADO',
    'TURNO_CANCELADO',
    'REPROGRAMACION_PROPUESTA',
    'REPROGRAMACION_SOLICITADA',
    'REPROGRAMACION_CONFIRMADA',
    'REPROGRAMACION_RECHAZADA'
  ));