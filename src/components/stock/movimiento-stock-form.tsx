"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registrarMovimientoStock } from "@/actions/stock";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UNIDAD } from "@/constants/labels";
import type { Product } from "@/types/models";

export function MovimientoStockForm({ producto }: { producto: Product }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [tipo, setTipo] = useState<"ENTRADA" | "AJUSTE">("ENTRADA");
  const [cantidad, setCantidad] = useState("");
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    setEnviando(true);
    const resultado = await registrarMovimientoStock({
      productId: producto.id,
      tipo,
      cantidad: Number(cantidad),
      motivo,
    });
    setEnviando(false);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }

    setCantidad("");
    setMotivo("");
    setAbierto(false);
    router.refresh();
  }

  if (!abierto) {
    return (
      <Button variant="secondary" onClick={() => setAbierto(true)}>
        Registrar movimiento
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 rounded-md border border-neutral-200 bg-white p-3 max-w-sm">
      {error && <p className="text-xs text-red-600">{error}</p>}

      <select
        className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        value={tipo}
        onChange={(e) => setTipo(e.target.value as "ENTRADA" | "AJUSTE")}
      >
        <option value="ENTRADA">Entrada (compra / reposición)</option>
        <option value="AJUSTE">Ajuste (corregir un conteo)</option>
      </select>

      <Input
        type="number"
        step="0.001"
        placeholder={tipo === "AJUSTE" ? "Cantidad (puede ser negativa)" : `Cantidad en ${UNIDAD[producto.unidad]}`}
        value={cantidad}
        onChange={(e) => setCantidad(e.target.value)}
        required
      />

      <Input
        placeholder="Motivo (opcional)"
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
      />

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