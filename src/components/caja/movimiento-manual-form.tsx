"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearMovimientoManual } from "@/actions/cash";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SelectorMedioPago } from "@/components/caja/selector-medio-pago";

type Metodo = "EFECTIVO" | "TRANSFERENCIA" | "TARJETA_CREDITO" | "TARJETA_DEBITO";

export function MovimientoManualForm() {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [tipo, setTipo] = useState<"INGRESO" | "EGRESO">("EGRESO");
  const [metodo, setMetodo] = useState<Metodo>("EFECTIVO");
  const [monto, setMonto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    setEnviando(true);
    const resultado = await crearMovimientoManual({
      tipo,
      metodo,
      monto: Number(monto),
      descripcion,
    });
    setEnviando(false);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }

    setMonto("");
    setDescripcion("");
    setAbierto(false);
    router.refresh();
  }

  if (!abierto) {
    return <Button onClick={() => setAbierto(true)}>+ Movimiento manual</Button>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 max-w-md rounded-md border border-neutral-200 bg-white p-4">
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <select
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          value={tipo}
          onChange={(e) => setTipo(e.target.value as "INGRESO" | "EGRESO")}
        >
          <option value="EGRESO">Egreso (gasto/retiro)</option>
          <option value="INGRESO">Ingreso</option>
        </select>
      </div>

      <SelectorMedioPago value={metodo} onChange={setMetodo} />

      <Input
        type="number"
        step="0.01"
        min="0"
        placeholder="Monto"
        value={monto}
        onChange={(e) => setMonto(e.target.value)}
        required
      />

      <Input
        placeholder="Descripción (ej: compra de insumos)"
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        required
      />

      <div className="flex gap-2">
        <Button type="submit" disabled={enviando}>
          {enviando ? "Guardando..." : "Registrar movimiento"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => setAbierto(false)}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}