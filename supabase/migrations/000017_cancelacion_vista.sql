-- =====================================================================
-- 017_cancelacion_vista
--   Marca cuándo el personal vio (descartó) el aviso de que un cliente
--   canceló su turno, para que deje de aparecer en el dashboard.
-- =====================================================================

alter table public.appointments
  add column cancelacion_vista_at timestamptz;

-- Las cancelaciones que ya existen no deben aparecer como avisos nuevos
update public.appointments
   set cancelacion_vista_at = now()
 where estado = 'CANCELADO';

create index appointments_cancelaciones_sin_ver_idx
  on public.appointments (cancelado_at desc)
  where estado = 'CANCELADO'
    and cancelado_por = 'CLIENTE'
    and cancelacion_vista_at is null;