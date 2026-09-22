"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { crearTurnoPublico } from "@/actions/appointments";
import { ServiciosGrid } from "./servicios-grid";
import { PeluquerasShowcase } from "./peluqueras-showcase";
import { ResumenSeleccion } from "./resumen-seleccion";
import { HorariosGrid } from "./horarios-grid";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { Service } from "@/types/models";

type Empleado = { id: string; nombre: string; apellido: string; foto_url: string | null };

export function ReservaForm({ servicios, equipo }: { servicios: Service[]; equipo: Empleado[] }) {

type Paso = 1 | 2 | 3;

  const router = useRouter();
  const [paso, setPaso] = useState<Paso>(1);

  const [servicioIds, setServicioIds] = useState<string[]>([]);
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [slot, setSlot] = useState<string | null>(null);

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [comentario, setComentario] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function confirmar(e: React.FormEvent) {
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
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-[#9C8577]">
        {paso > 1 && (
          <button
            type="button"
            onClick={() => setPaso((p) => (p - 1) as Paso)}
            className="flex items-center gap-1 text-[#6B4635] font-medium"
          >
            <ChevronLeft className="h-4 w-4" /> Volver
          </button>
        )}
        <span className="ml-auto">Paso {paso} de 3</span>
      </div>

      {paso === 1 && (
        <div className="space-y-6">
          <ServiciosGrid servicios={servicios} value={servicioIds} onChange={setServicioIds} />
          <PeluquerasShowcase equipo={equipo} />
          <ResumenSeleccion
            servicios={servicios}
            servicioIds={servicioIds}
            onContinuar={() => setPaso(2)}
          />
        </div>
      )}

      {paso === 2 && (
        <div className="space-y-6">
          <HorariosGrid
            servicioIds={servicioIds}
            fecha={fecha}
            onFechaChange={setFecha}
            value={slot}
            onChange={setSlot}
          />
          <Button className="w-full" disabled={!slot} onClick={() => setPaso(3)}>
            Continuar
          </Button>
        </div>
      )}

      {paso === 3 && (
        <form onSubmit={confirmar} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-[#F7E9E2] border border-[#E8C9B8] px-3 py-2 text-sm text-[#B1543A]">
              {error}
            </div>
          )}

          <h2 className="text-sm font-medium text-[#4A3428]">Tus datos</h2>
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
            <Input placeholder="Apellido" value={apellido} onChange={(e) => setApellido(e.target.value)} required />
          </div>
          <Input placeholder="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} required />
          <Input placeholder="Email (opcional)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Textarea placeholder="Comentario (opcional)" rows={2} value={comentario} onChange={(e) => setComentario(e.target.value)} />

          <Button type="submit" className="w-full" disabled={enviando}>
            {enviando ? "Reservando..." : "Confirmar turno"}
          </Button>
        </form>
      )}
    </div>
  );
}