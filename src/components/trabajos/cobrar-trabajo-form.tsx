"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cobrarTrabajo } from "@/actions/works";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectorMedioPago } from "@/components/caja/selector-medio-pago";
import { formatearPesos } from "@/lib/format";

type PagoItem = {
  metodo: "EFECTIVO" | "TRANSFERENCIA" | "TARJETA_CREDITO" | "TARJETA_DEBITO";
  monto: string;
  cuotas: string;
};

export function CobrarTrabajoForm({ id, saldoPendiente }: { id: string; saldoPendiente: number }) {
  const router = useRouter();
  const [items, setItems] = useState<PagoItem[]>([
    { metodo: "EFECTIVO", monto: String(saldoPendiente), cuotas: "" },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function agregarItem() {
    setItems([...items, { metodo: "EFECTIVO", monto: "", cuotas: "" }]);
  }

  function quitarItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function actualizarMetodo(index: number, metodo: PagoItem["metodo"]) {
    setItems(
      items.map((it, i) => {
        if (i !== index) return it;
        return { ...it, metodo, cuotas: metodo === "TARJETA_CREDITO" ? it.cuotas : "" };
      })
    );
  }

  function actualizarCuotas(index: number, cuotas: string) {
    setItems(items.map((it, i) => (i === index ? { ...it, cuotas } : it)));
  }

  function actualizarMonto(index: number, monto: string) {
    setItems(items.map((it, i) => (i === index ? { ...it, monto } : it)));
  }

  const sumaPagos = items.reduce((acc, it) => acc + (Number(it.monto) || 0), 0);
  const superaElSaldo = sumaPagos - saldoPendiente > 0.005;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (superaElSaldo) {
      setError(
        `El monto cargado (${formatearPesos(sumaPagos)}) supera el saldo pendiente (${formatearPesos(saldoPendiente)}).`
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

      <p className="text-sm text-neutral-600">
        Saldo pendiente: <span className="font-medium">{formatearPesos(saldoPendiente)}</span>
      </p>

      {items.map((item, index) => (
        <div key={index} className="flex flex-wrap gap-2 items-center">
          <SelectorMedioPago
            value={item.metodo}
            onChange={(v) => actualizarMetodo(index, v)}
            mostrarCuotas
            cuotas={item.cuotas}
            onCuotasChange={(v) => actualizarCuotas(index, v)}
          />
          <Input
            type="number"
            step="0.01"
            min="0"
            max={saldoPendiente}
            placeholder="Monto"
            className="w-32"
            value={item.monto}
            onChange={(e) => actualizarMonto(index, e.target.value)}
          />
          {items.length > 1 && (
            <Button type="button" variant="ghost" onClick={() => quitarItem(index)}>
              Quitar
            </Button>
          )}
        </div>
      ))}

      <Button type="button" variant="secondary" onClick={agregarItem}>
        Agregar otro medio de pago
      </Button>

      <p className={`text-sm ${superaElSaldo ? "text-red-600 font-medium" : "text-neutral-500"}`}>
        Suma cargada: {formatearPesos(sumaPagos)}
        {superaElSaldo && " — supera el saldo pendiente"}
      </p>

      <div>
        <Button type="submit" disabled={enviando || superaElSaldo}>
          {enviando ? "Cobrando..." : "Registrar cobro"}
        </Button>
      </div>
    </form>
  );
}