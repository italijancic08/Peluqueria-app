import { CalendarClock } from "lucide-react";
import { mostrarFechaHora } from "@/lib/dates";
import { formatearTelefono } from "@/lib/format";
import { ResponderSolicitudButtons } from "./responder-solicitud-buttons";

export type SolicitudPendienteItem = {
  id: string;
  numero: number;
  cliente: string;
  telefono: string | null;
  inicioActual: string;
  inicioPropuesto: string;
  motivo: string | null;
  creadaEl: string;
};

export function SolicitudesPendientes({
  solicitudes,
}: {
  solicitudes: SolicitudPendienteItem[];
}) {
  if (solicitudes.length === 0) return null;

  return (
    <section className="space-y-3 rounded-xl border border-[#EDD9C4] bg-[#FBF0DC] p-4">
      <div className="flex items-center gap-2">
        <CalendarClock className="h-4 w-4 shrink-0 text-[#A8741F]" />
        <h2 className="text-sm font-semibold text-[#4A3428]">
          {solicitudes.length === 1
            ? "1 pedido de reprogramación pendiente"
            : `${solicitudes.length} pedidos de reprogramación pendientes`}
        </h2>
      </div>

      <ul className="space-y-2">
        {solicitudes.map((s) => (
          <li
            key={s.id}
            className="flex flex-col gap-3 rounded-lg border border-[#EDD9C4] bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 space-y-1 text-sm">
              <p className="font-medium text-[#4A3428]">
                #{s.numero} · {s.cliente}
                {s.telefono && (
                  <span className="font-normal text-[#9C8577]">
                    {" "}
                    · {formatearTelefono(s.telefono)}
                  </span>
                )}
              </p>
              <p className="text-[#4A3428]">
                <span className="text-[#9C8577]">Ahora:</span> {mostrarFechaHora(s.inicioActual)}
                <span className="mx-1 text-[#9C8577]">→</span>
                <span className="font-medium">{mostrarFechaHora(s.inicioPropuesto)}</span>
              </p>
              {s.motivo && (
                <p className="break-words text-[#9C8577]">Motivo: “{s.motivo}”</p>
              )}
            </div>

            <ResponderSolicitudButtons solicitudId={s.id} />
          </li>
        ))}
      </ul>
    </section>
  );
}