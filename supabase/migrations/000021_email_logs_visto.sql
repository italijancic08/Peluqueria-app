-- =====================================================================
-- 021_email_logs_visto
--   Marca cuándo el personal vio (descartó) el aviso de un mail que no
--   se pudo enviar, para que deje de aparecer en el dashboard.
-- =====================================================================

alter table public.email_logs
  add column visto_at timestamptz;

-- Los fallos que ya existen no deben aparecer como avisos nuevos
update public.email_logs
   set visto_at = now()
 where estado = 'FALLIDO';

create index email_logs_fallidos_sin_ver_idx
  on public.email_logs (created_at desc)
  where estado = 'FALLIDO'
    and visto_at is null;

-- Todo el personal puede leer el historial para ver los avisos en el
-- dashboard (la pantalla de Monitorización sigue siendo solo de admins).
create policy email_logs_staff_select
  on public.email_logs for select to authenticated
  using (public.is_staff());

-- ...y marcarlos como vistos. Solo se puede modificar esa columna.
revoke update on public.email_logs from anon, authenticated;
grant update (visto_at) on public.email_logs to authenticated;

create policy email_logs_staff_marcar_visto
  on public.email_logs for update to authenticated
  using (public.is_staff())
  with check (public.is_staff());