"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearMovimientoCCManual } from "@/actions/account";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function MovimientoCCManualForm({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [tipo, setTipo] = useState<"DEBITO" | "CREDITO">("DEBITO");
  const [monto, setMonto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);

    const resultado = await crearMovimientoCCManual({
      clientId,
      tipo,
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
    return (
      <Button variant="secondary" onClick={() => setAbierto(true)}>
        Movimiento manual
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 rounded-md border border-[#EDD9C4] bg-white p-3 max-w-sm">
      {error && <p className="text-xs text-red-600">{error}</p>}
      <select
        className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        value={tipo}
        onChange={(e) => setTipo(e.target.value as "DEBITO" | "CREDITO")}
      >
        <option value="DEBITO">Cargo (aumenta la deuda)</option>
        <option value="CREDITO">Ajuste a favor (reduce la deuda)</option>
      </select>
      <Input type="number" step="0.01" min="0" placeholder="Monto" value={monto} onChange={(e) => setMonto(e.target.value)} />
      <Input placeholder="Motivo" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
      <div className="flex gap-2">
        <Button type="submit" disabled={enviando}>
          {enviando ? "Guardando..." : "Registrar"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setAbierto(false)}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}