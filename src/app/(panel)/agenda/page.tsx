import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { SelectorFechaAgenda } from "@/components/turnos/selector-fecha-agenda";
import { CancelarTurnoButton } from "@/components/turnos/cancelar-turno-button";
import {
  ReprogramarTurnoButton,
  RetirarPropuestaButton,
} from "@/components/turnos/reprogramar-turno-button";
import {
  SolicitudesPendientes,
  type SolicitudPendienteItem,
} from "@/components/turnos/solicitudes-pendientes";
import { mostrarHora } from "@/lib/dates";
import { estadoTurnoVista } from "@/lib/estado-turno";

export default async function TurnosPage({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string }>;
}) {
  const { fecha } = await searchParams;
  const fechaConsulta = fecha ?? new Date().toISOString().slice(0, 10);
  const ahora = new Date().getTime();

  const supabase = await createClient();
  await supabase.rpc("expirar_turnos_vencidos");

  const { data: settings } = await supabase
    .from("business_settings")
    .select("aviso_sin_tomar_min")
    .eq("id", 1)
    .single();
  const avisoMin = settings?.aviso_sin_tomar_min ?? 60;

  const { data: turnos, error } = await supabase
    .from("appointments")
    .select(
      "*, clients(nombre, apellido, telefono), works(estado, profile_id, profiles(nombre, apellido)), appointment_reschedules(id, estado, solicitado_por)"
    )
    .gte("fecha_hora_inicio", `${fechaConsulta}T00:00:00`)
    .lt("fecha_hora_inicio", `${fechaConsulta}T23:59:59`)
    .order("fecha_hora_inicio");

  // Pedidos de reprogramación de clientes que esperan respuesta (de cualquier día)
  const { data: solicitudesRaw } = await supabase
    .from("appointment_reschedules")
    .select(
      "id, motivo, fecha_hora_inicio_propuesta, created_at, appointments!inner(numero, estado, fecha_hora_inicio, clients(nombre, apellido, telefono))"
    )
    .eq("estado", "PENDIENTE")
    .eq("solicitado_por", "CLIENTE")
    .eq("appointments.estado", "CONFIRMADO")
    .order("created_at");

  const solicitudes: SolicitudPendienteItem[] = (solicitudesRaw ?? []).flatMap((s) => {
    const turno = Array.isArray(s.appointments) ? s.appointments[0] : s.appointments;
    if (!turno) return [];
    const cliente = Array.isArray(turno.clients) ? turno.clients[0] : turno.clients;
    return [
      {
        id: s.id,
        numero: turno.numero,
        cliente: cliente ? `${cliente.apellido}, ${cliente.nombre}` : "—",
        telefono: cliente?.telefono ?? null,
        inicioActual: turno.fecha_hora_inicio,
        inicioPropuesto: s.fecha_hora_inicio_propuesta,
        motivo: s.motivo,
        creadaEl: s.created_at,
      },
    ];
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-[#4A3428]">Turnos</h1>
        <Link href="/agenda/nuevo">
          <Button>Nuevo turno</Button>
        </Link>
      </div>

      <SolicitudesPendientes solicitudes={solicitudes} />

      <SelectorFechaAgenda fecha={fechaConsulta} />

      {error && <p className="text-sm text-red-600">No se pudieron cargar los turnos.</p>}

      {!error && turnos && turnos.length === 0 && (
        <p className="text-sm text-neutral-500">No hay turnos para ese día.</p>
      )}

      {!error && turnos && turnos.length > 0 && (
        <Table>
          <Thead>
            <Tr>
              <Th>Hora</Th>
              <Th>Cliente</Th>
              <Th>Atiende</Th>
              <Th>Estado</Th>
              <Th></Th>
            </Tr>
          </Thead>
          <Tbody>
            {turnos.map((t) => {
              const trabajo = Array.isArray(t.works) ? t.works[0] : t.works;
              const vista = estadoTurnoVista({
                estadoTurno: t.estado,
                estadoTrabajo: trabajo?.estado,
                inicio: t.fecha_hora_inicio,
                ahora,
                avisoMin,
              });
              const atiende = trabajo?.profiles
                ? `${trabajo.profiles.nombre} ${trabajo.profiles.apellido}`
                : trabajo?.profile_id
                  ? "Asignado"
                  : "Sin asignar";
              const pendiente =
                (t.appointment_reschedules ?? []).find((r) => r.estado === "PENDIENTE") ?? null;

              return (
                <Tr key={t.id}>
                  <Td>{mostrarHora(t.fecha_hora_inicio)}</Td>
                  <Td>
                    {t.clients?.apellido}, {t.clients?.nombre}
                  </Td>
                  <Td>{atiende}</Td>
                  <Td>
                    <div className="flex flex-col items-start gap-1">
                      <Badge variant={vista.variante}>{vista.etiqueta}</Badge>
                      {pendiente?.solicitado_por === "CLIENTE" && (
                        <Badge variant="warning">Pidió reprogramar</Badge>
                      )}
                      {pendiente?.solicitado_por === "STAFF" && (
                        <Badge variant="neutral">Esperando al cliente</Badge>
                      )}
                      {t.estado === "CANCELADO" && t.cancelado_por && (
                        <span className="max-w-[16rem] break-words text-xs text-[#9C8577]">
                          {t.cancelado_por === "CLIENTE"
                            ? "Canceló el cliente"
                            : t.cancelado_por === "SISTEMA"
                              ? "Expiró"
                              : "Canceló la peluquería"}
                          {t.motivo_cancelacion ? `: ${t.motivo_cancelacion}` : ""}
                        </span>
                      )}
                    </div>
                  </Td>
                  <Td className="text-right">
                    <div className="flex flex-wrap items-center justify-end gap-1">
                      {vista.puedeCancelar && !pendiente && (
                        <ReprogramarTurnoButton id={t.id} />
                      )}
                      {pendiente?.solicitado_por === "STAFF" && (
                        <RetirarPropuestaButton solicitudId={pendiente.id} />
                      )}
                      {vista.puedeCancelar && <CancelarTurnoButton id={t.id} />}
                    </div>
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      )}
    </div>
  );
}