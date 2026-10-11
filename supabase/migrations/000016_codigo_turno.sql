-- =====================================================================
-- 016_codigo_turno
--   Código corto (6 caracteres) para que el cliente encuentre su turno
--   desde "Gestionar turno". Alfabeto sin 0/O/1/I para evitar confusiones.
-- =====================================================================

alter table public.appointments
  add column codigo text;

create or replace function public.generar_codigo_turno()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  alfabeto constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_codigo text;
  i        int;
begin
  loop
    v_codigo := '';
    for i in 1..6 loop
      v_codigo := v_codigo || substr(alfabeto, 1 + floor(random() * length(alfabeto))::int, 1);
    end loop;
    exit when not exists (
      select 1 from public.appointments where codigo = v_codigo
    );
  end loop;
  return v_codigo;
end;
$$;

-- Turnos que ya existen: se les asigna un código a cada uno
do $$
declare
  r record;
begin
  for r in select id from public.appointments where codigo is null loop
    update public.appointments
       set codigo = public.generar_codigo_turno()
     where id = r.id;
  end loop;
end;
$$;

alter table public.appointments
  alter column codigo set default public.generar_codigo_turno(),
  alter column codigo set not null;

create unique index appointments_codigo_key
  on public.appointments (codigo);