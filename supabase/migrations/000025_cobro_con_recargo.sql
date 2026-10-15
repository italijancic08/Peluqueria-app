-- =====================================================================
-- 025_cobro_con_recargo
--  Cobro con precio dual (efectivo/transferencia vs tarjeta) y pagos mixtos.
--
--  * works.total y work_items.precio_snapshot siguen siendo el precio en
--    efectivo/transferencia ("precio base").
--  * Cada pago guarda el dinero REAL recibido (monto) y cuánto del precio
--    base cubre (monto_base):
--      - efectivo, transferencia y cuenta corriente: monto_base = monto
--      - tarjeta: monto_base = monto / (1 + recargo/100)
--  * El trabajo queda cobrado cuando lo cubierto alcanza el precio base.
--  * La caja sigue sumando el dinero real recibido (cash_movements.monto).
-- =====================================================================

alter table public.payments
  add column if not exists monto_base numeric(12,2),
  add column if not exists recargo_pct numeric(5,2) not null default 0;

-- Pagos anteriores: se cobraron al precio base, sin recargo.
update public.payments set monto_base = monto where monto_base is null;

alter table public.payments alter column monto_base set not null;

comment on column public.payments.monto is
  'Dinero realmente recibido (con tarjeta incluye el recargo).';
comment on column public.payments.monto_base is
  'Parte del precio base (efectivo/transferencia) que cubre este pago.';
comment on column public.payments.recargo_pct is
  'Recargo de tarjeta (%) vigente al momento del pago; 0 si no fue con tarjeta.';

create or replace function public.cobrar_trabajo(p_work_id uuid, p_pagos jsonb)
returns table (cobrado boolean, total_pagado numeric)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_work            public.works%rowtype;
  v_ya_cubierto     numeric(12,2);
  v_nuevo_cubierto  numeric(12,2) := 0;
  v_total_cubierto  numeric(12,2);
  v_pago            jsonb;
  v_pct             numeric(5,2);
  v_recargo         numeric(5,2);
  v_payment_id      uuid;
  v_nombre_cliente  text;
  v_metodo          payment_method;
  v_monto           numeric(12,2);
  v_monto_base      numeric(12,2);
  v_recargo_pago    numeric(5,2);
  v_cc_habilitada   boolean;
begin
  if not public.is_staff() then
    raise exception 'No autorizado';
  end if;

  select * into v_work from public.works where id = p_work_id for update;

  if v_work.id is null then
    raise exception 'Trabajo no encontrado';
  end if;

  if v_work.estado = 'COBRADO' then
    raise exception 'Este trabajo ya fue cobrado';
  end if;

  if v_work.estado <> 'FINALIZADO' then
    raise exception 'El trabajo todavía no está finalizado';
  end if;

  select recargo_tarjeta_pct into v_recargo
  from public.business_settings where id = 1;
  v_recargo := coalesce(v_recargo, 0);

  -- Lo que ya cubrieron los pagos anteriores (en precio base).
  select coalesce(sum(monto_base), 0) into v_ya_cubierto
  from public.payments where work_id = p_work_id;

  -- Lo que cubren los pagos nuevos: con tarjeta, cada peso cubre 1/(1+recargo) de precio base.
  for v_pago in select * from jsonb_array_elements(p_pagos)
  loop
    v_monto := (v_pago->>'monto')::numeric;

    if v_monto is null or v_monto <= 0 then
      raise exception 'El monto de cada pago tiene que ser mayor a 0';
    end if;

    if (v_pago->>'metodo') like 'TARJETA%' then
      v_nuevo_cubierto := v_nuevo_cubierto + round(v_monto / (1 + v_recargo / 100), 2);
    else
      v_nuevo_cubierto := v_nuevo_cubierto + v_monto;
    end if;
  end loop;

  -- Tolerancia de 1 centavo por los redondeos de la tarjeta.
  if v_ya_cubierto + v_nuevo_cubierto > v_work.total + 0.01 then
    raise exception 'El monto ingresado supera el saldo pendiente. Faltan solo % (a precio efectivo/transferencia)',
      (v_work.total - v_ya_cubierto);
  end if;

  select trim(nombre || ' ' || apellido), cuenta_corriente_habilitada
  into v_nombre_cliente, v_cc_habilitada
  from public.clients where id = v_work.client_id;

  for v_pago in select * from jsonb_array_elements(p_pagos)
  loop
    v_metodo := (v_pago->>'metodo')::payment_method;
    v_monto := (v_pago->>'monto')::numeric;

    if v_metodo = 'CUENTA_CORRIENTE' and not coalesce(v_cc_habilitada, false) then
      raise exception 'Este cliente no tiene cuenta corriente habilitada';
    end if;

    if v_metodo::text like 'TARJETA%' then
      v_recargo_pago := v_recargo;
      v_monto_base := round(v_monto / (1 + v_recargo / 100), 2);
    else
      v_recargo_pago := 0;
      v_monto_base := v_monto;
    end if;

    insert into public.payments (work_id, metodo, monto, monto_base, recargo_pct, cuotas, created_by)
    values (
      p_work_id,
      v_metodo,
      v_monto,
      v_monto_base,
      v_recargo_pago,
      nullif(v_pago->>'cuotas', '')::smallint,
      auth.uid()
    )
    returning id into v_payment_id;

    if v_metodo = 'CUENTA_CORRIENTE' then
      -- La cuenta corriente se cobra al precio base (efectivo/transferencia).
      insert into public.account_movements (client_id, tipo, monto, work_id, descripcion, created_by)
      values (v_work.client_id, 'DEBITO', v_monto, p_work_id, 'Cargo trabajo #' || v_work.numero, auth.uid());
    else
      insert into public.cash_movements (tipo, metodo, monto, payment_id, work_id, created_by, descripcion)
      values ('INGRESO', v_metodo, v_monto, v_payment_id, p_work_id, auth.uid(), 'Cobro a ' || coalesce(v_nombre_cliente, 'cliente'));
    end if;
  end loop;

  v_total_cubierto := v_ya_cubierto + v_nuevo_cubierto;

  if abs(v_work.total - v_total_cubierto) <= 0.01 then
    update public.works
    set estado = 'COBRADO', cobrado_at = now()
    where id = p_work_id;

    if v_work.profile_id is not null then
      select coalesce(comision_pct, (select comision_default_pct from public.business_settings where id = 1))
      into v_pct
      from public.profiles where id = v_work.profile_id;

      -- La comisión se calcula sobre el precio base (sin el recargo de tarjeta).
      insert into public.employee_commissions (work_id, profile_id, base_monto, porcentaje_snapshot, monto)
      values (p_work_id, v_work.profile_id, v_work.total, v_pct, round(v_work.total * v_pct / 100, 2))
      on conflict (work_id) do nothing;
    end if;

    return query select true, v_total_cubierto;
  else
    return query select false, v_total_cubierto;
  end if;
end;
$$;