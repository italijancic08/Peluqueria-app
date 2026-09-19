"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearTurnoInterno } from "@/actions/appointments";
import { SelectorServicios } from "./selector-servicios";
import { TurnoScheduler } from "./turno-scheduler";
import { SelectorCliente } from "./selector-cliente";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { Client, Service } from "@/types/models";

type PresupuestoPrefill = {
  budgetId: string;
  clientId: string;
  clientLabel: string;
  servicioIds: string[];
};

type Props = {
  servicios: Service[];
  presupuesto?: PresupuestoPrefill | null;
};

export function TurnoInternoForm({ servicios, presupuesto }: Props) {
  const router = useRouter();
  const [cliente, setCliente] = useState<Client | null>(
    presupuesto
      ? ({
          id: presupuesto.clientId,
          nombre: "",
          apellido: presupuesto.clientLabel,
          telefono: "",
        } as Client)
      : null
  );
  const [servicioIds, setServicioIds] = useState<string[]>(presupuesto?.servicioIds ?? []);
  const [slot, setSlot] = useState<string | null>(null);
  const [asignarme, setAsignarme] = useState(false);
  const [comentario, setComentario] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!cliente) {
      setError("Elegí un cliente.");
      return;
    }
    if (!slot) {
      setError("Elegí un horario.");
      return;
    }

    setEnviando(true);
    const resultado = await crearTurnoInterno({
      clientId: cliente.id,
      servicioIds,
      fechaHoraInicio: slot,
      asignarme,
      comentario,
      budgetId: presupuesto?.budgetId ?? null,
    });
    setEnviando(false);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }

    router.push("/agenda");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {presupuesto && (
        <p className="text-sm text-neutral-500">
          Turno para el presupuesto aceptado — cliente y servicios ya cargados.
        </p>
      )}

      <div>
        <h2 className="text-sm font-medium text-neutral-700 mb-2">Cliente</h2>
        {presupuesto ? (
          <div className="rounded-md border border-neutral-200 px-3 py-2 text-sm">
            {presupuesto.clientLabel}
          </div>
        ) : (
          <SelectorCliente value={cliente} onChange={setCliente} />
        )}
      </div>

      <div>
        <h2 className="text-sm font-medium text-neutral-700 mb-2">Servicios</h2>
        <SelectorServicios servicios={servicios} value={servicioIds} onChange={setServicioIds} />
      </div>

      <div>
        <h2 className="text-sm font-medium text-neutral-700 mb-2">Horario</h2>
        <TurnoScheduler servicioIds={servicioIds} value={slot} onChange={setSlot} />
      </div>

      <label className="flex items-center gap-2 text-sm text-neutral-700">
        <input type="checkbox" checked={asignarme} onChange={(e) => setAsignarme(e.target.checked)} />
        Asignarme este turno
      </label>

      <Textarea
        placeholder="Comentario (opcional)"
        rows={2}
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
      />

      <Button type="submit" disabled={enviando}>
        {enviando ? "Creando..." : "Crear turno"}
      </Button>
    </form>
  );
}