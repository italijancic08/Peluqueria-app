import type { Metadata } from "next";
import Link from "next/link";
import { Scissors } from "lucide-react";
import { cargarTurnoPorToken } from "@/lib/turnos/gestion";
import { mostrarFecha, mostrarFechaHora } from "@/lib/dates";
import { Badge } from "@/components/ui/badge";
import { GestionarTurnoAcciones } from "@/components/turnos/gestionar-turno-acciones";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tu turno",
  robots: { index: false, follow: false },
};

function capitalizar(texto: string) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

const ESTADO_VISTA: Record<string, { etiqueta: string; variante: "success" | "neutral" | "danger" | "warning" }> = {
  CONFIRMADO: { etiqueta: "Confirmado", variante: "success" },
  EN_CURSO: { etiqueta: "En proceso", variante: "success" },
  FINALIZADO: { etiqueta: "Finalizado", variante: "neutral" },
  CANCELADO: { etiqueta: "Cancelado", variante: "danger" },
  AUSENTE: { etiqueta: "No asistió", variante: "danger" },
};

function Contenedor({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-start sm:items-center justify-center py-6 sm:py-10 px-4">
      <div className="w-full max-w-md md:max-w-xl bg-white rounded-2xl shadow-sm border border-[#EDD9C4] p-5 sm:p-8 space-y-6">
        {children}
      </div>
    </div>
  );
}

export default async function GestionarTurnoPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const turno = await cargarTurnoPorToken(token);

  if (!turno) {
    return (
      <Contenedor>
        <div className="flex flex-col items-center text-center gap-2">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#6B4635]">
            <Scissors className="h-6 w-6 text-white" />
          </span>
          <h1 className="text-xl font-semibold text-[#4A3428] font-[family-name:var(--font-display)]">
            No encontramos el turno
          </h1>
          <p className="text-sm text-[#9C8577]">
            Revisá que el enlace esté completo o comunicate con nosotros.
          </p>
          <Link href="/turnos" className="mt-2 text-sm font-medium text-[#6B4635] underline">
            Reservar un turno
          </Link>
        </div>
      </Contenedor>
    );
  }

  const vista = ESTADO_VISTA[turno.estado] ?? { etiqueta: turno.estado, variante: "neutral" as const };
  const confirmado = turno.estado === "CONFIRMADO";
  const cancelado = turno.estado === "CANCELADO";

  const pendiente = turno.pendiente
    ? {
        solicitadoPor: turno.pendiente.solicitado_por as "CLIENTE" | "STAFF",
        inicioTexto: capitalizar(
          mostrarFecha(turno.pendiente.fecha_hora_inicio_propuesta, "EEEE d 'de' MMMM, HH:mm 'hs'")
        ),
        motivo: turno.pendiente.motivo,
      }
    : null;

  const rechazada =
    confirmado && turno.ultimaResuelta?.estado === "RECHAZADA" ? turno.ultimaResuelta : null;

  return (
    <Contenedor>
      <div className="flex flex-col items-center text-center gap-2">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#6B4635]">
          <Scissors className="h-6 w-6 text-white" />
        </span>
        <h1 className="text-xl font-semibold text-[#4A3428] font-[family-name:var(--font-display)]">
          Tu turno #{turno.numero}
        </h1>
        {turno.nombreCliente && (
          <p className="text-sm text-[#9C8577]">Hola, {turno.nombreCliente}.</p>
        )}
        <Badge variant={vista.variante}>{vista.etiqueta}</Badge>
      </div>

      <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-[#9C8577]">Fecha</dt>
          <dd className="font-medium text-[#4A3428]">
            {capitalizar(mostrarFecha(turno.inicio, "EEEE d 'de' MMMM"))}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-[#9C8577]">Hora</dt>
          <dd className="font-medium text-[#4A3428]">
            {mostrarFecha(turno.inicio, "HH:mm")} hs · {turno.duracionMin} min
          </dd>
        </div>
        {turno.servicios.length > 0 && (
          <div className="sm:col-span-2">
            <dt className="text-xs text-[#9C8577]">Servicios</dt>
            <dd className="font-medium text-[#4A3428]">{turno.servicios.join(", ")}</dd>
          </div>
        )}
      </dl>

      {cancelado && (
        <div className="rounded-lg border border-[#E8C9B8] bg-[#F7E9E2] px-3 py-3 text-sm text-[#B1543A] space-y-1">
          <p className="font-medium">
            {turno.canceladoPor === "CLIENTE"
              ? "Cancelaste este turno."
              : turno.canceladoPor === "SISTEMA"
                ? "Este turno se canceló automáticamente."
                : "Este turno fue cancelado por la peluquería."}
          </p>
          {turno.motivoCancelacion && (
            <p className="break-words">Motivo: “{turno.motivoCancelacion}”</p>
          )}
        </div>
      )}

      {rechazada && (
        <div className="rounded-lg border border-[#EDD9C4] bg-[#FBF3EA] px-3 py-3 text-sm text-[#4A3428] space-y-1">
          <p className="font-medium">
            {rechazada.solicitado_por === "CLIENTE"
              ? "No pudimos aceptar tu pedido de cambio de horario."
              : "Rechazaste el nuevo horario que te propusimos."}
          </p>
          <p className="text-[#9C8577]">
            Tu turno sigue el {mostrarFechaHora(turno.inicio)}.
          </p>
          {rechazada.respuesta_motivo && (
            <p className="break-words text-[#9C8577]">Motivo: “{rechazada.respuesta_motivo}”</p>
          )}
        </div>
      )}

      {confirmado && (
        <GestionarTurnoAcciones
          token={token}
          puedeGestionar={turno.gestion.ok}
          razonBloqueo={turno.gestion.razon}
          pendiente={pendiente}
        />
      )}

      <div className="text-center">
        <Link href="/turnos" className="text-sm font-medium text-[#6B4635] underline">
          Reservar otro turno
        </Link>
      </div>
    </Contenedor>
  );
}