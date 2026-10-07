"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearPresupuesto } from "@/actions/budgets";
import { SelectorCliente } from "@/components/turnos/selector-cliente";
import { SelectorServicios } from "@/components/turnos/selector-servicios";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { formatearPesos } from "@/lib/format";
import { RUTAS } from "@/constants/routes";
import type { Client, Service } from "@/types/models";

export function PresupuestoForm({ servicios }: { servicios: Service[] }) {
  const router = useRouter();
  const [cliente, setCliente] = useState<Client | null>(null);
  const [servicioIds, setServicioIds] = useState<string[]>([]);
  const [notas, setNotas] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const total = servicios
    .filter((s) => servicioIds.includes(s.id))
    .reduce((acc, s) => acc + Number(s.precio), 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!cliente) {
      setError("Elegí un cliente.");
      return;
    }

    if (servicioIds.length === 0) {
      setError("Elegí al menos un servicio.");
      return;
    }

    setEnviando(true);

    const resultado = await crearPresupuesto({
      clientId: cliente.id,
      servicioIds,
      notas,
    });

    if (!resultado.ok) {
      setEnviando(false);
      setError(resultado.error);
      return;
    }

    try {
      const respuestaWord = await fetch(
        `/api/presupuestos/${resultado.data.id}/word`
      );

      if (!respuestaWord.ok) {
        throw new Error("No se pudo generar el presupuesto.");
      }

      const blob = await respuestaWord.blob();

      const url = window.URL.createObjectURL(blob);
      const enlace = document.createElement("a");

      enlace.href = url;
      enlace.download = `Presupuesto-${resultado.data.numero}.docx`;

      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();

      window.URL.revokeObjectURL(url);
    } catch {
      setError(
        "El presupuesto se creó correctamente, pero no se pudo generar el archivo Word."
      );
      setEnviando(false);
      return;
    }

    setEnviando(false);

    router.push(`${RUTAS.presupuestos}/${resultado.data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <h2 className="text-sm font-medium text-neutral-700 mb-2">Cliente</h2>
        <SelectorCliente value={cliente} onChange={setCliente} />
      </div>

      <div>
        <h2 className="text-sm font-medium text-neutral-700 mb-2">Servicios</h2>
        <SelectorServicios servicios={servicios} value={servicioIds} onChange={setServicioIds} />
      </div>

      {servicioIds.length > 0 && (
        <div className="flex items-center justify-between text-sm font-medium border-t border-neutral-200 pt-3">
          <span className="text-neutral-700">Total estimado</span>
          <span className="text-neutral-900">{formatearPesos(total)}</span>
        </div>
      )}

      <Textarea
        placeholder="Notas (opcional)"
        rows={3}
        value={notas}
        onChange={(e) => setNotas(e.target.value)}
      />

      <Button type="submit" disabled={enviando}>
        {enviando ? "Creando..." : "Crear presupuesto"}
      </Button>
    </form>
  );
}