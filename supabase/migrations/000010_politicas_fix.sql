create policy work_items_staff_update on public.work_items
  for update to authenticated
  using (public.is_staff())
  with check (public.is_staff());