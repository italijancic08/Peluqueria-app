-- =====================================================================
-- 028_hora_limite_trabajo
--   Hora máxima hasta la que se puede extender un turno pasado el
--   cierre del local. NULL = sin límite.
--   Si es anterior al cierre del día (ej. 01:00) se interpreta como
--   madrugada del día siguiente.
-- =====================================================================

alter table public.business_settings
  add column hora_limite_trabajo time;

comment on column public.business_settings.hora_limite_trabajo is
  'Hora límite de finalización de un turno en la última franja del día. NULL = sin límite.';