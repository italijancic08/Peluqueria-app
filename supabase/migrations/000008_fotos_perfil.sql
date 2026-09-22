-- =====================================================================
-- 008_fotos_perfil — Foto de perfil y visibilidad en la reserva pública
-- =====================================================================

alter table public.profiles add column if not exists foto_url text;
alter table public.profiles add column if not exists visible_publico boolean not null default true;

-- Bucket público para las fotos de perfil.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Solo el personal logueado puede subir/actualizar/borrar archivos ahí.
create policy avatars_staff_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and public.is_staff());

create policy avatars_staff_update on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and public.is_staff());

create policy avatars_staff_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and public.is_staff());

-- Función pública: solo expone lo necesario para la vitrina de la reserva
-- (nunca email, teléfono ni comisión).
create or replace function public.equipo_publico()
returns table (id uuid, nombre text, apellido text, foto_url text)
language sql
stable
security definer
set search_path = public
as $$
  select id, nombre, apellido, foto_url
  from public.profiles
  where activo and visible_publico
  order by nombre;
$$;

grant execute on function public.equipo_publico() to anon, authenticated;

--xx

drop policy if exists avatars_staff_insert on storage.objects;
drop policy if exists avatars_staff_update on storage.objects;
drop policy if exists avatars_staff_delete on storage.objects;

create policy avatars_staff_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and exists (select 1 from public.profiles where id = auth.uid() and activo)
  );

create policy avatars_staff_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and exists (select 1 from public.profiles where id = auth.uid() and activo)
  );

create policy avatars_staff_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and exists (select 1 from public.profiles where id = auth.uid() and activo)
  );