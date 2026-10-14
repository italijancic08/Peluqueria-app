"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, TriangleAlert } from "lucide-react";
import { crearTurnoPublico } from "@/actions/appointments";
import { ServiciosGrid } from "./servicios-grid";
import { PeluquerasShowcase } from "./peluqueras-showcase";
import { ResumenSeleccion } from "./resumen-seleccion";
import { HorariosGrid } from "./horarios-grid";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { hoyISO } from "@/lib/dates";
import type { Variantes } from "@/lib/seleccion";
import type { ServiceWithVariants } from "@/types/models";

type Empleado = { id: string; nombre: string; apellido: string; foto_url: string | null };

export function ReservaForm({
  servicios,
  equipo,
  recargoPct,
}: {
  servicios: ServiceWithVariants[];
  equipo: Empleado[];
  recargoPct: number;
}) {

type Paso = 1 | 2 | 3;

  const router = useRouter();
  const [paso, setPaso] = useState<Paso>(1);

  const [servicioIds, setServicioIds] = useState<string[]>([]);
  const [variantes, setVariantes] = useState<Variantes>({});
  const [fecha, setFecha] = useState(() => hoyISO());
  const [slot, setSlot] = useState<string | null>(null);

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [comentario, setComentario] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [avisoSinEmail, setAvisoSinEmail] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  function confirmar(e: React.FormEvent) {
    e.preventDefault();
    // Sin email dejamos reservar, pero primero avisamos qué se pierde.
    if (!email.trim()) {
      setAvisoSinEmail(true);
      return;
    }
    void reservar();
  }

  async function reservar() {
    setError(null);

    if (!slot) {
      setError("Elegí un horario.");
      return;
    }

    setEnviando(true);
    const resultado = await crearTurnoPublico({
      nombre, apellido, telefono, email, comentario,
      servicioIds, variantes, fechaHoraInicio: slot,
    });
    setEnviando(false);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }

    const sinEmail = email.trim() ? "" : "&sinEmail=1";
    router.push(
      `/turnos/confirmacion?numero=${resultado.data.numero}&token=${resultado.data.token}&codigo=${resultado.data.codigo}${sinEmail}`
    );
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
          <ServiciosGrid
            servicios={servicios}
            value={servicioIds}
            onChange={setServicioIds}
            variantes={variantes}
            onVariantesChange={setVariantes}
            recargoPct={recargoPct}
          />
          <PeluquerasShowcase equipo={equipo} />
          <ResumenSeleccion
            servicios={servicios}
            servicioIds={servicioIds}
            variantes={variantes}
            recargoPct={recargoPct}
            onContinuar={() => setPaso(2)}
          />
        </div>
      )}

      {paso === 2 && (
        <div className="space-y-6">
          <HorariosGrid
            servicioIds={servicioIds}
            variantes={variantes}
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
            <Input placeholder="Apellido (opcional)" value={apellido} onChange={(e) => setApellido(e.target.value)} />
          </div>
          <Input placeholder="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} required />
          <div className="space-y-1.5">
            <Input
              ref={emailRef}
              placeholder="Email (opcional)"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setAvisoSinEmail(false);
              }}
            />
            {!email.trim() && (
              <p className="text-xs text-[#9C8577]">
                Recomendamos cargarlo: es por donde te enviamos la confirmación del turno con tu
                código, los avisos de cambios o cancelaciones y tus comprobantes.
              </p>
            )}
          </div>
          <Textarea placeholder="Comentario (opcional)" rows={2} value={comentario} onChange={(e) => setComentario(e.target.value)} />

          {avisoSinEmail && !email.trim() ? (
            <div className="space-y-3 rounded-xl border border-[#EDD9C4] bg-[#FBF3EA] p-4">
              <div className="flex items-start gap-3">
                <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-[#A8741F]" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[#4A3428]">¿Querés seguir sin email?</p>
                  <p className="text-sm text-[#4A3428]">
                    Sin un email no te vamos a poder enviar la confirmación del turno, los avisos de
                    cambios o cancelaciones, ni tus comprobantes y presupuestos. Vas a tener que
                    guardar tu código de turno para poder gestionarlo.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  className="w-full"
                  onClick={() => {
                    setAvisoSinEmail(false);
                    emailRef.current?.focus();
                  }}
                >
                  Agregar mi email
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  disabled={enviando}
                  onClick={() => void reservar()}
                >
                  {enviando ? "Reservando..." : "Continuar sin email"}
                </Button>
              </div>
            </div>
          ) : (
            <Button type="submit" className="w-full" disabled={enviando}>
              {enviando ? "Reservando..." : "Confirmar turno"}
            </Button>
          )}
        </form>
      )}
    </div>
  );
}