"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cobrarTrabajo } from "@/actions/works";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatearPesos } from "@/lib/format";
import { MEDIO_PAGO } from "@/constants/labels";

type PagoItem = {
  metodo: keyof typeof MEDIO_PAGO;
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

  function actualizarItem(index: number, campo: keyof PagoItem, valor: string) {
    setItems(
      items.map((it, i) => {
        if (i !== index) return it;
        const actualizado = { ...it, [campo]: valor };
        if (campo === "metodo" && valor !== "TARJETA_CREDITO") actualizado.cuotas = "";
        return actualizado;
      })
    );
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
          <select
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
            value={item.metodo}
            onChange={(e) => actualizarItem(index, "metodo", e.target.value)}
          >
            {Object.entries(MEDIO_PAGO).map(([valor, label]) => (
              <option key={valor} value={valor}>
                {label}
              </option>
            ))}
          </select>
          <Input
            type="number"
            step="0.01"
            min="0"
            max={saldoPendiente}
            placeholder="Monto"
            className="w-32"
            value={item.monto}
            onChange={(e) => actualizarItem(index, "monto", e.target.value)}
          />
          {item.metodo === "TARJETA_CREDITO" && (
            <select
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
              value={item.cuotas}
              onChange={(e) => actualizarItem(index, "cuotas", e.target.value)}
            >
              <option value="">Cuotas</option>
              {[1, 2, 3, 6, 9, 12, 18, 24].map((c) => (
                <option key={c} value={c}>
                  {c === 1 ? "1 pago" : `${c} cuotas`}
                </option>
              ))}
            </select>
          )}
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