-- =====================================================================
-- 018_horario_partido
--   Cada día puede tener dos franjas de atención (mañana y tarde).
--   La tarde es opcional. Además se agrega el domingo (día 0), que
--   queda cerrado hasta que se active desde el panel.
-- =====================================================================

alter table public.business_hours
  add column hora_apertura_2 time,
  add column hora_cierre_2   time,
  add constraint business_hours_tarde_completa
    check ((hora_apertura_2 is null) = (hora_cierre_2 is null)),
  add constraint business_hours_tarde_valida
    check (
      hora_apertura_2 is null
      or (hora_cierre_2 > hora_apertura_2 and hora_apertura_2 > hora_cierre)
    );

insert into public.business_hours (dia_semana, hora_apertura, hora_cierre, activo)
values (0, '09:00', '13:00', false)
on conflict (dia_semana) do nothing;