"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { finalizarTrabajo } from "@/actions/works";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Product } from "@/types/models";

type ConsumoItem = { productId: string; cantidad: string };
type ItemConFicha = { serviceId: string; nombre: string };

type Props = {
  id: string;
  productos: Product[];
  itemsConFicha: ItemConFicha[];
};

export function FinalizarTrabajoForm({ id, productos, itemsConFicha }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<ConsumoItem[]>([]);
  const [fichas, setFichas] = useState<Record<string, string>>({});
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

  function actualizarFicha(serviceId: string, valor: string) {
    setFichas((prev) => ({ ...prev, [serviceId]: valor }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsedItems = items
      .filter((it) => it.productId && it.cantidad)
      .map((it) => ({ productId: it.productId, cantidad: Number(it.cantidad) }));

    const parsedFichas = itemsConFicha
      .map((it) => ({ serviceId: it.serviceId, contenido: fichas[it.serviceId] ?? "" }))
      .filter((f) => f.contenido.trim().length > 0);

    setEnviando(true);
    const resultado = await finalizarTrabajo(id, { items: parsedItems, fichas: parsedFichas });
    setEnviando(false);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }

    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}

      {itemsConFicha.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-neutral-700">Fichas técnicas</p>
          {itemsConFicha.map((it) => (
            <div key={it.serviceId} className="space-y-1">
              <label className="text-sm text-neutral-600">{it.nombre}</label>
              <Textarea
                rows={2}
                placeholder="Detalles (fórmula, tiempos, observaciones)"
                value={fichas[it.serviceId] ?? ""}
                onChange={(e) => actualizarFicha(it.serviceId, e.target.value)}
              />
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3">
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
      </div>

      <div>
        <Button type="submit" disabled={enviando}>
          {enviando ? "Finalizando..." : "Finalizar trabajo"}
        </Button>
      </div>
    </form>
  );
}