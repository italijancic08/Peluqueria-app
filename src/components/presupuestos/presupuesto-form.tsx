"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { crearPresupuesto } from "@/actions/budgets";

import { SelectorCliente } from "@/components/turnos/selector-cliente";
import { SelectorServicios } from "@/components/turnos/selector-servicios";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

import { formatearPesos } from "@/lib/format";
import { precioTarjeta } from "@/lib/precios";
import { resolverElegidos, type Variantes } from "@/lib/seleccion";
import { RUTAS } from "@/constants/routes";

import type { Client, ServiceWithVariants } from "@/types/models";

export function PresupuestoForm({
  servicios,
  recargoPct,
}: {
  servicios: ServiceWithVariants[];
  recargoPct: number;
}) {
  const router = useRouter();

  const [cliente, setCliente] =
    useState<Client | null>(null);

  const [servicioIds, setServicioIds] =
    useState<string[]>([]);

  const [variantes, setVariantes] = useState<Variantes>({});

  const [notas, setNotas] = useState("");

  const [error, setError] =
    useState<string | null>(null);

  const [enviando, setEnviando] =
    useState(false);

  const { items, faltantes } = resolverElegidos(servicios, servicioIds, variantes);
  const total = items.reduce((acc, i) => acc + i.precio, 0);

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setError(null);

    if (!cliente) {
      setError("Elegí un cliente.");
      return;
    }

    if (servicioIds.length === 0) {
      setError(
        "Elegí al menos un servicio."
      );
      return;
    }

    if (faltantes.length > 0) {
      setError(`Elegí una opción para: ${faltantes.map((s) => s.nombre).join(", ")}.`);
      return;
    }

    setEnviando(true);

    const resultado =
      await crearPresupuesto({
        clientId: cliente.id,
        servicioIds,
        variantes,
        notas,
      });

    if (!resultado.ok) {
      setEnviando(false);
      setError(resultado.error);
      return;
    }

    setEnviando(false);

    router.push(
      `${RUTAS.presupuestos}/${resultado.data.id}`
    );

    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 max-w-lg"
    >
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <h2 className="text-sm font-medium text-neutral-700 mb-2">
          Cliente
        </h2>

        <SelectorCliente
          value={cliente}
          onChange={setCliente}
        />
      </div>

      <div>
        <h2 className="text-sm font-medium text-neutral-700 mb-2">
          Servicios
        </h2>

        <SelectorServicios
          servicios={servicios}
          value={servicioIds}
          onChange={setServicioIds}
          variantes={variantes}
          onVariantesChange={setVariantes}
          recargoPct={recargoPct}
        />
      </div>

      {servicioIds.length > 0 && (
        <div className="space-y-1 border-t border-neutral-200 pt-3 text-sm font-medium">
          <div className="flex items-center justify-between">
            <span className="text-neutral-700">Total efectivo / transferencia</span>
            <span className="text-neutral-900">{formatearPesos(total)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-700">Total con tarjeta (+{recargoPct}%)</span>
            <span className="text-neutral-900">{formatearPesos(precioTarjeta(total, recargoPct))}</span>
          </div>
        </div>
      )}

      <Textarea
        placeholder="Notas (opcional)"
        rows={3}
        value={notas}
        onChange={(e) =>
          setNotas(e.target.value)
        }
      />

      <Button
        type="submit"
        disabled={enviando}
      >
        {enviando
          ? "Creando..."
          : "Crear presupuesto"}
      </Button>
    </form>
  );
}