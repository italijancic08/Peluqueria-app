"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearTurnoPublico } from "@/actions/appointments";
import { SelectorServicios } from "./selector-servicios";
import { TurnoScheduler } from "./turno-scheduler";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { Service } from "@/types/models";

export function ReservaForm({ servicios }: { servicios: Service[] }) {
  const router = useRouter();
  const [servicioIds, setServicioIds] = useState<string[]>([]);
  const [slot, setSlot] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [comentario, setComentario] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!slot) {
      setError("Elegí un horario.");
      return;
    }

    setEnviando(true);
    const resultado = await crearTurnoPublico({
      nombre, apellido, telefono, email, comentario,
      servicioIds, fechaHoraInicio: slot,
    });
    setEnviando(false);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }

    router.push(`/turnos/confirmacion?numero=${resultado.data.numero}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <h2 className="text-sm font-medium text-neutral-700 mb-2">Servicios</h2>
        <SelectorServicios servicios={servicios} value={servicioIds} onChange={setServicioIds} />
      </div>

      <div>
        <h2 className="text-sm font-medium text-neutral-700 mb-2">Horario</h2>
        <TurnoScheduler servicioIds={servicioIds} value={slot} onChange={setSlot} />
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-neutral-700">Tus datos</h2>
        <div className="grid grid-cols-2 gap-3">
          <Input placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          <Input placeholder="Apellido" value={apellido} onChange={(e) => setApellido(e.target.value)} required />
        </div>
        <Input placeholder="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} required />
        <Input placeholder="Email (opcional)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Textarea placeholder="Comentario (opcional)" rows={2} value={comentario} onChange={(e) => setComentario(e.target.value)} />
      </div>

      <Button type="submit" className="w-full" disabled={enviando}>
        {enviando ? "Reservando..." : "Confirmar turno"}
      </Button>
    </form>
  );
}