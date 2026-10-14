-- El apellido del cliente pasa a ser opcional (se guarda vacío cuando no se carga)
alter table public.clients drop constraint if exists clients_apellido_check;
alter table public.clients alter column apellido set default '';