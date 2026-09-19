-- =====================================================================
-- 003_settings_publico — La reserva pública necesita leer capacidad
-- e intervalo de turnos sin estar autenticada.
-- =====================================================================

create policy settings_select_public on public.business_settings
  for select to anon using (true);