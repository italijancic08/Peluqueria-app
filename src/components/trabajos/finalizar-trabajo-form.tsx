"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { finalizarTrabajo } from "@/actions/works";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Product } from "@/types/models";

type ConsumoItem = { productId: string; cantidad: string };

export function FinalizarTrabajoForm({ id, productos }: { id: string; productos: Product[] }) {
  const router = useRouter();
  const [items, setItems] = useState<ConsumoItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function agregarItem() {
    setItems([...items, { productId: "", cantidad: "" }]);
  }

  function quitarItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function actualizarItem(index: number, campo: keyof ConsumoItem, valor: string) {
    setItems(items.map((it, i) => (i === index ? { ...it, [campo]: valor } : it)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsedItems = items
      .filter((it) => it.productId && it.cantidad)
      .map((it) => ({ productId: it.productId, cantidad: Number(it.cantidad) }));

    setEnviando(true);
    const resultado = await finalizarTrabajo(id, { items: parsedItems });
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

      <p className="text-sm text-neutral-500">
        Productos usados (opcional). Se descuentan del stock al finalizar.
      </p>

      {items.map((item, index) => (
        <div key={index} className="flex gap-2 items-center">
          <select
            className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
            value={item.productId}
            onChange={(e) => actualizarItem(index, "productId", e.target.value)}
          >
            <option value="">Elegí un producto</option>
            {productos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
          <Input
            type="number"
            step="0.001"
            min="0"
            placeholder="Cantidad"
            className="w-28"
            value={item.cantidad}
            onChange={(e) => actualizarItem(index, "cantidad", e.target.value)}
          />
          <Button type="button" variant="ghost" onClick={() => quitarItem(index)}>
            Quitar
          </Button>
        </div>
      ))}

      <Button type="button" variant="secondary" onClick={agregarItem}>
        Agregar producto
      </Button>

      <div>
        <Button type="submit" disabled={enviando}>
          {enviando ? "Finalizando..." : "Finalizar trabajo"}
        </Button>
      </div>
    </form>
  );
}