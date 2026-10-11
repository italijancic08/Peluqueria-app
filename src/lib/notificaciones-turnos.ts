import type { createClient } from "@/lib/supabase/server";
import { uno } from "@/lib/turnos/gestion";
import { mostrarFecha, mostrarFechaHora } from "@/lib/dates";
import type { CancelacionClienteItem } from "@/components/dashboard/alerta-cancelacion-cliente";
import type { ReprogramacionClienteItem } from "@/components/dashboard/alerta-reprogramacion-cliente";

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

/** Máximo de avisos de cada tipo que se muestran a la vez en el dashboard. */
const MAX_AVISOS = 5;

function nombreCliente(c: { nombre: string; apellido: string } | null): string {
  return c ? `${c.apellido}, ${c.nombre}` : "Un cliente";
}

/** Turnos que el cliente canceló y que nadie del personal vio todavía. */
export async function cargarCancelacionesCliente(
  supabase: SupabaseServer
): Promise<CancelacionClienteItem[]> {
  const { data } = await supabase
    .from("appointments")
    .select("id, numero, fecha_hora_inicio, motivo_cancelacion, clients(nombre, apellido)")
    .eq("estado", "CANCELADO")
    .eq("cancelado_por", "CLIENTE")
    .is("cancelacion_vista_at", null)
    .order("cancelado_at", { ascending: false })
    .limit(MAX_AVISOS);

  return (data ?? []).map((t) => ({
    id: t.id,
    numero: t.numero,
    cliente: nombreCliente(uno(t.clients)),
    inicioTexto: mostrarFechaHora(t.fecha_hora_inicio),
    fechaAgenda: mostrarFecha(t.fecha_hora_inicio, "yyyy-MM-dd"),
    motivo: t.motivo_cancelacion,
  }));
}

/** Pedidos de reprogramación del cliente que siguen esperando respuesta. */
export async function cargarReprogramacionesPendientes(
  supabase: SupabaseServer
): Promise<ReprogramacionClienteItem[]> {
  const { data } = await supabase
    .from("appointment_reschedules")
    .select(
      "id, fecha_hora_inicio_propuesta, appointments!inner(numero, estado, fecha_hora_inicio, clients(nombre, apellido))"
    )
    .eq("estado", "PENDIENTE")
    .eq("solicitado_por", "CLIENTE")
    .eq("appointments.estado", "CONFIRMADO")
    .order("created_at")
    .limit(MAX_AVISOS);

  return (data ?? []).flatMap((s) => {
    const turno = uno(s.appointments);
    if (!turno) return [];
    return [
      {
        id: s.id,
        numero: turno.numero,
        cliente: nombreCliente(uno(turno.clients)),
        inicioActualTexto: mostrarFechaHora(turno.fecha_hora_inicio),
        inicioPropuestoTexto: mostrarFechaHora(s.fecha_hora_inicio_propuesta),
      },
    ];
  });
}