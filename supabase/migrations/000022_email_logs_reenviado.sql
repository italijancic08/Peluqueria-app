-- =====================================================================
-- 022_email_logs_reenviado
--   Marca cuándo se reenvió con éxito un mail que había fallado
--   (botón "Reintentar" en Monitorización).
-- =====================================================================

alter table public.email_logs
  add column reenviado_at timestamptz;