"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cobrarTrabajo } from "@/actions/works";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectorMedioPago, type MedioPagoValue } from "@/components/caja/selector-medio-pago";
import { formatearPesos } from "@/lib/format";
import { precioTarjeta } from "@/lib/precios";

type PagoItem = {
  metodo: MedioPagoValue;
  monto: string;
  cuotas: string;
};

type Props = {
  id: string;
  /** Saldo pendiente en precio base (efectivo/transferencia). */
  saldoPendiente: number;
  cuentaCorrienteHabilitada: boolean;
  recargoPct: number;
};

const redondear = (n: number) => Math.round(n * 100) / 100;
const esTarjeta = (m: MedioPagoValue) => m === "TARJETA_CREDITO" || m === "TARJETA_DEBITO";

export function CobrarTrabajoForm({ id, saldoPendiente, cuentaCorrienteHabilitada, recargoPct }: Props) {
  const router = useRouter();
  const factor = 1 + recargoPct / 100;

  /** Cuánto del precio base cubre un pago: con tarjeta, cada peso cubre 1/(1+recargo). */
  function cubierto(it: PagoItem): number {
    const monto = Number(it.monto) || 0;
    return esTarjeta(it.metodo) ? redondear(monto / factor) : monto;
  }

  /** Monto que hay que cargar en el pago `index`, con `metodo`, para cubrir lo que falta. */
  function montoParaCompletar(lista: PagoItem[], index: number, metodo: MedioPagoValue): number {
    const otros = lista.reduce((acc, it, i) => (i === index ? acc : acc + cubierto(it)), 0);
    const resto = redondear(saldoPendiente - otros);
    if (resto <= 0) return 0;
    return esTarjeta(metodo) ? redondear(resto * factor) : resto;
  }

  const [items, setItems] = useState<PagoItem[]>([
    { metodo: "EFECTIVO", monto: String(redondear(saldoPendiente)), cuotas: "" },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function agregarItem() {
    const resto = redondear(saldoPendiente - items.reduce((acc, it) => acc + cubierto(it), 0));
    setItems([
      ...items,
      { metodo: "EFECTIVO", monto: resto > 0 ? String(resto) : "", cuotas: "" },
    ]);
  }

  function quitarItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function actualizarMetodo(index: number, metodo: MedioPagoValue) {
    setItems(
      items.map((it, i) => {
        if (i !== index) return it;

        // Si el pago estaba completando el saldo, se recalcula para el nuevo medio.
        const completaba = Math.abs((Number(it.monto) || 0) - montoParaCompletar(items, index, it.metodo)) < 0.01;
        const monto = completaba ? String(montoParaCompletar(items, index, metodo)) : it.monto;

        return { ...it, metodo, monto, cuotas: metodo === "TARJETA_CREDITO" ? it.cuotas : "" };
      })
    );
  }

  function actualizarCuotas(index: number, cuotas: string) {
    setItems(items.map((it, i) => (i === index ? { ...it, cuotas } : it)));
  }

  function actualizarMonto(index: number, monto: string) {
    setItems(items.map((it, i) => (i === index ? { ...it, monto } : it)));
  }

  function completar(index: number) {
    const monto = montoParaCompletar(items, index, items[index].metodo);
    setItems(items.map((it, i) => (i === index ? { ...it, monto: monto > 0 ? String(monto) : "" } : it)));
  }

  const totalCubierto = items.reduce((acc, it) => acc + cubierto(it), 0);
  const totalARecibir = items.reduce((acc, it) => acc + (Number(it.monto) || 0), 0);
  const faltante = redondear(saldoPendiente - totalCubierto);
  const superaElSaldo = faltante < -0.01;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (superaElSaldo) {
      setError(
        `Lo cargado cubre ${formatearPesos(totalCubierto)} y el saldo pendiente es ${formatearPesos(saldoPendiente)}.`
      );
      return;
    }

    const parsedItems = items
      .filter((it) => it.monto)
      .map((it) => ({
        metodo: it.metodo,
        monto: Number(it.monto),
        cuotas: it.metodo === "TARJETA_CREDITO" && it.cuotas ? Number(it.cuotas) : null,
      }));

    if (parsedItems.length === 0) {
      setError("Cargá al menos un pago.");
      return;
    }

    setEnviando(true);
    const resultado = await cobrarTrabajo(id, { items: parsedItems });
    setEnviando(false);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }

    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="rounded-md bg-neutral-50 px-3 py-2 text-sm space-y-0.5">
        <p className="text-neutral-700">
          Saldo pendiente en efectivo / transferencia:{" "}
          <span className="font-medium">{formatearPesos(saldoPendiente)}</span>
        </p>
        <p className="text-neutral-700">
          Saldo pendiente con tarjeta (+{recargoPct}%):{" "}
          <span className="font-medium">{formatearPesos(precioTarjeta(saldoPendiente, recargoPct))}</span>
        </p>
        <p className="text-xs text-neutral-500">
          Podés combinar medios: lo que se paga con tarjeta cubre menos del saldo porque incluye el recargo.
        </p>
      </div>

      {items.map((item, index) => (
        <div key={index} className="space-y-1">
          <div className="flex flex-wrap gap-2 items-center">
            <SelectorMedioPago
              value={item.metodo}
              onChange={(v) => actualizarMetodo(index, v)}
              mostrarCuotas
              cuotas={item.cuotas}
              onCuotasChange={(v) => actualizarCuotas(index, v)}
              permitirCuentaCorriente={cuentaCorrienteHabilitada}
            />
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="Monto"
              className="w-32"
              value={item.monto}
              onChange={(e) => actualizarMonto(index, e.target.value)}
            />
            <Button type="button" variant="ghost" onClick={() => completar(index)}>
              Completar saldo
            </Button>
            {items.length > 1 && (
              <Button type="button" variant="ghost" onClick={() => quitarItem(index)}>
                Quitar
              </Button>
            )}
          </div>
          {esTarjeta(item.metodo) && Number(item.monto) > 0 && (
            <p className="text-xs text-neutral-500">
              Con tarjeta se cobran {formatearPesos(Number(item.monto))} y cubren{" "}
              {formatearPesos(cubierto(item))} del saldo (precio efectivo/transferencia).
            </p>
          )}
        </div>
      ))}

      <Button type="button" variant="secondary" onClick={agregarItem}>
        Agregar otro medio de pago
      </Button>

      <div
        className={`text-sm space-y-0.5 ${superaElSaldo ? "text-red-600 font-medium" : "text-neutral-600"}`}
      >
        <p>Total a recibir: {formatearPesos(totalARecibir)}</p>
        <p>
          {superaElSaldo
            ? `Cubre ${formatearPesos(totalCubierto)}: supera el saldo pendiente`
            : faltante > 0.01
              ? `Todavía falta cubrir ${formatearPesos(faltante)} (a precio efectivo/transferencia)`
              : "Cubre el saldo completo"}
        </p>
      </div>

      <div>
        <Button type="submit" disabled={enviando || superaElSaldo}>
          {enviando ? "Cobrando..." : "Registrar cobro"}
        </Button>
      </div>
    </form>
  );
}