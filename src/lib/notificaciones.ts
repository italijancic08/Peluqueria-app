import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type TipoNotificacion =
  | "TURNO_CANCELADO_POR_CLIENTE"
  | "TURNO_CANCELADO_POR_STAFF"
  | "REPROGRAMACION_SOLICITADA_POR_CLIENTE"
  | "REPROGRAMACION_PROPUESTA_POR_STAFF"
  | "REPROGRAMACION_ACEPTADA"
  | "REPROGRAMACION_RECHAZADA"
  | "REPROGRAMACION_RETIRADA";

export type DestinatarioNotificacion = "CLIENTE" | "STAFF";

type Params = {
  appointmentId: string;
  rescheduleId?: string | null;
  tipo: TipoNotificacion;
  destinatario: DestinatarioNotificacion;
  payload?: Record<string, string | number | boolean | null>;
};

/**
 * Deja un evento en la cola `notifications`. Más adelante un worker
 * (mail / WhatsApp Business) lee las filas PENDIENTE y las envía.
 *
 * Nunca lanza error: si falla el encolado, la operación principal
 * (cancelar, reprogramar) no tiene que fallar por eso.
 */
export async function encolarNotificacion(
  cliente: SupabaseClient<Database>,
  p: Params
): Promise<void> {
  const { error } = await cliente.from("notifications").insert({
    appointment_id: p.appointmentId,
    reschedule_id: p.rescheduleId ?? null,
    tipo: p.tipo,
    destinatario: p.destinatario,
    payload: p.payload ?? {},
  });

  if (error) {
    console.error("[notificaciones] No se pudo encolar:", error.message);
  }
}