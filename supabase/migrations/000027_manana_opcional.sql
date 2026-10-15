-- =====================================================================
-- 027_manana_opcional
--   La mañana pasa a ser opcional (igual que la tarde): hay días que
--   solo se atiende a la tarde. Un día activo debe tener al menos un turno.
-- =====================================================================

alter table public.business_hours
  alter column hora_apertura drop not null,
  alter column hora_cierre   drop not null;

-- La tarde tenía como regla abrir después del cierre de la mañana;
-- se rehace para contemplar que la mañana puede no existir.
alter table public.business_hours
  drop constraint business_hours_tarde_valida;

alter table public.business_hours
  add constraint business_hours_manana_completa
    check ((hora_apertura is null) = (hora_cierre is null)),
  add constraint business_hours_tarde_valida
    check (
      hora_apertura_2 is null
      or (
        hora_cierre_2 > hora_apertura_2
        and (hora_cierre is null or hora_apertura_2 > hora_cierre)
      )
    ),
  add constraint business_hours_al_menos_un_turno
    check (
      not activo
      or hora_apertura is not null
      or hora_apertura_2 is not null
    );