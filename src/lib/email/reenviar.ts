import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";
import type { ActionResult } from "@/types/models";
import {
  enviarComprobantePorEmail,
  enviarEmailReprogramacionConfirmada,
  enviarEmailReprogramacionPropuesta,
  enviarEmailReprogramacionRechazada,
  enviarEmailReprogramacionSolicitada,
  enviarEmailTurnoCancelado,
  enviarEmailTurnoConfirmado,
  enviarPresupuestoPorEmail,
} from "./notificar";
import type { TipoEmail } from "./tipos";

type Admin = SupabaseClient<Database>;

type LogFallido = {
  id: string;
  tipo: string;
  created_at: string;
  work_id: string | null;
  budget_id: string | null;
  appointment_id: string | null;
};

type Preparado = { ok: true; enviar: () => Promise<void> } | { ok: false; error: string };

const SIN_REFERENCIA: Preparado = {
  ok: false,
  error: "Este registro no tiene un elemento asociado para reintentar (¿se eliminó?).",
};

/**
 * Reconstruye, a partir del estado actual de la base, los datos que necesita el
 * mail original. Si la situación cambió y el aviso ya no corresponde (por ejemplo,
 * el turno se canceló después), no se reenvía.
 */
async function preparar(admin: Admin, log: LogFallido): Promise<Preparado> {
  const tipo = log.tipo as TipoEmail;

  if (tipo === "COMPROBANTE") {
    const workId = log.work_id;
    if (!workId) return SIN_REFERENCIA;
    return { ok: true, enviar: () => enviarComprobantePorEmail(workId) };
  }

  if (tipo === "PRESUPUESTO") {
    const budgetId = log.budget_id;
    if (!budgetId) return SIN_REFERENCIA;
    return { ok: true, enviar: () => enviarPresupuestoPorEmail(budgetId) };
  }

  const turnoId = log.appointment_id;
  if (!turnoId) return SIN_REFERENCIA;

  const { data: turno } = await admin
    .from("appointments")
    .select("estado, fecha_hora_inicio, cancelado_por, motivo_cancelacion")
    .eq("id", turnoId)
    .maybeSingle();

  if (!turno) return { ok: false, error: "No se encontró el turno." };

  if (tipo === "TURNO_CANCELADO") {
    if (turno.estado !== "CANCELADO") {
      return { ok: false, error: "El turno ya no está cancelado: no corresponde reenviar este aviso." };
    }
    return {
      ok: true,
      enviar: () =>
        enviarEmailTurnoCancelado(turnoId, {
          canceladoPor: turno.cancelado_por === "CLIENTE" ? "CLIENTE" : "STAFF",
          motivo: turno.motivo_cancelacion,
        }),
    };
  }

  if (turno.estado !== "CONFIRMADO") {
    return { ok: false, error: "El turno ya no está confirmado: no corresponde reenviar este aviso." };
  }

  if (tipo === "TURNO_CONFIRMADO") {
    return { ok: true, enviar: () => enviarEmailTurnoConfirmado(turnoId) };
  }

  // Reprogramaciones: se busca la solicitud a la que corresponde el mail.
  const { data: solicitudes } = await admin
    .from("appointment_reschedules")
    .select(
      "estado, solicitado_por, fecha_hora_inicio_anterior, fecha_hora_inicio_propuesta, motivo, respuesta_motivo, created_at, respondido_at"
    )
    .eq("appointment_id", turnoId);
  const lista = solicitudes ?? [];

  const referencia = new Date(log.created_at).getTime();
  const masCercana = (estado: string, solicitadoPor?: string) =>
    lista
      .filter((s) => s.estado === estado && (!solicitadoPor || s.solicitado_por === solicitadoPor))
      .sort(
        (a, b) =>
          Math.abs(new Date(a.respondido_at ?? a.created_at).getTime() - referencia) -
          Math.abs(new Date(b.respondido_at ?? b.created_at).getTime() - referencia)
      )[0] ?? null;

  if (tipo === "REPROGRAMACION_PROPUESTA" || tipo === "REPROGRAMACION_SOLICITADA") {
    const porStaff = tipo === "REPROGRAMACION_PROPUESTA";
    const s = lista.find(
      (x) => x.estado === "PENDIENTE" && x.solicitado_por === (porStaff ? "STAFF" : "CLIENTE")
    );
    if (!s) {
      return {
        ok: false,
        error: "La solicitud ya fue respondida o retirada: no corresponde reenviar este aviso.",
      };
    }
    const datos = { inicioPropuesto: s.fecha_hora_inicio_propuesta, motivo: s.motivo };
    return {
      ok: true,
      enviar: () =>
        porStaff
          ? enviarEmailReprogramacionPropuesta(turnoId, datos)
          : enviarEmailReprogramacionSolicitada(turnoId, datos),
    };
  }

  if (tipo === "REPROGRAMACION_CONFIRMADA") {
    const s = masCercana("ACEPTADA");
    if (!s) return { ok: false, error: "No se encontró la reprogramación aceptada." };
    if (
      new Date(s.fecha_hora_inicio_propuesta).getTime() !==
      new Date(turno.fecha_hora_inicio).getTime()
    ) {
      return { ok: false, error: "El turno cambió de horario desde esa reprogramación." };
    }
    return {
      ok: true,
      enviar: () =>
        enviarEmailReprogramacionConfirmada(turnoId, {
          inicioAnterior: s.fecha_hora_inicio_anterior,
          aceptadoPedidoDelCliente: s.solicitado_por === "CLIENTE",
        }),
    };
  }

  if (tipo === "REPROGRAMACION_RECHAZADA") {
    const s = masCercana("RECHAZADA", "CLIENTE");
    if (!s) return { ok: false, error: "No se encontró el pedido rechazado." };
    return {
      ok: true,
      enviar: () =>
        enviarEmailReprogramacionRechazada(turnoId, {
          inicioPedido: s.fecha_hora_inicio_propuesta,
          motivo: s.respuesta_motivo,
        }),
    };
  }

  return { ok: false, error: "Este tipo de mail no se puede reenviar." };
}

/**
 * Reintenta un mail que figura como FALLIDO. El permiso (solo admin) se valida
 * en la acción que llama a esta función; acá se usa service_role porque los
 * usuarios no tienen permiso de escritura sobre email_logs.
 */
export async function reenviarEmailFallido(logId: string): Promise<ActionResult> {
  const admin = createAdminClient();

  // 1) Se "reclama" el registro para que un doble clic no mande el mail dos veces.
  const { data: log } = await admin
    .from("email_logs")
    .update({ reenviado_at: new Date().toISOString() })
    .eq("id", logId)
    .eq("estado", "FALLIDO")
    .is("reenviado_at", null)
    .select("id, tipo, created_at, work_id, budget_id, appointment_id")
    .maybeSingle();

  if (!log) {
    return { ok: false, error: "Este mail ya fue reenviado o no se puede reintentar." };
  }

  const liberar = async () => {
    await admin.from("email_logs").update({ reenviado_at: null }).eq("id", log.id);
  };

  const preparado = await preparar(admin, log);
  if (!preparado.ok) {
    await liberar();
    return { ok: false, error: preparado.error };
  }

  // 2) Se envía. `enviarEmail` deja su propio registro (ENVIADO o FALLIDO).
  const desde = new Date(Date.now() - 5000).toISOString();
  await preparado.enviar();

  // 3) Se mira cómo resultó el nuevo intento.
  const columna =
    log.tipo === "COMPROBANTE"
      ? "work_id"
      : log.tipo === "PRESUPUESTO"
        ? "budget_id"
        : "appointment_id";

  const { data: recientes } = await admin
    .from("email_logs")
    .select("id, estado, motivo, work_id, budget_id, appointment_id")
    .eq("tipo", log.tipo)
    .neq("id", log.id)
    .gte("created_at", desde)
    .order("created_at", { ascending: false })
    .limit(20);

  const nuevo = (recientes ?? []).find((r) => r[columna] === log[columna]);

  if (!nuevo) {
    await liberar();
    return {
      ok: false,
      error: "No se generó ningún envío. Revisá que el cliente tenga un email cargado.",
    };
  }

  if (nuevo.estado !== "ENVIADO") {
    // El fallo ya se le muestra al admin acá: no hace falta otro aviso en el dashboard.
    await admin
      .from("email_logs")
      .update({ visto_at: new Date().toISOString() })
      .eq("id", nuevo.id);
    await liberar();
    return { ok: false, error: `Volvió a fallar: ${nuevo.motivo ?? "sin detalle"}` };
  }

  // 4) Salió bien: el aviso original deja de aparecer en el dashboard.
  await admin
    .from("email_logs")
    .update({ visto_at: new Date().toISOString() })
    .eq("id", log.id);

  return { ok: true, data: undefined };
}