import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { encolarNotificacion } from "@/lib/notificaciones";
import { horarioDisponible } from "./slots";
import { turnoModificable, uno } from "./gestion";
import type { Database } from "@/types/database";
import type { ActionResult } from "@/types/models";

type Cliente = SupabaseClient<Database>;

export type Actor = { tipo: "CLIENTE" } | { tipo: "STAFF"; profileId: string };

function contraparte(actor: Actor): "CLIENTE" | "STAFF" {
  return actor.tipo === "CLIENTE" ? "STAFF" : "CLIENTE";
}

function profileIdDe(actor: Actor): string | null {
  return actor.tipo === "STAFF" ? actor.profileId : null;
}

function limpiar(motivo?: string): string | null {
  return motivo?.trim() ? motivo.trim() : null;
}

// ---------------------------------------------------------------------
// Cancelar
// ---------------------------------------------------------------------

export async function cancelarTurnoComun(
  cliente: Cliente,
  turnoId: string,
  actor: Actor,
  motivo?: string
): Promise<ActionResult> {
  const ahora = new Date().toISOString();

  const { data: turno, error } = await cliente
    .from("appointments")
    .update({
      estado: "CANCELADO",
      cancelado_por: actor.tipo,
      motivo_cancelacion: limpiar(motivo),
      cancelado_at: ahora,
      cancelado_por_profile_id: profileIdDe(actor),
    })
    .eq("id", turnoId)
    .eq("estado", "CONFIRMADO")
    .select("id, numero, fecha_hora_inicio")
    .maybeSingle();

  if (error) return { ok: false, error: "No se pudo cancelar el turno." };
  if (!turno) return { ok: false, error: "Este turno ya no se puede cancelar." };

  await cliente
    .from("works")
    .update({ estado: "CANCELADO" })
    .eq("appointment_id", turnoId)
    .in("estado", ["DISPONIBLE", "TOMADO"]);

  // Si había una reprogramación pendiente, queda sin efecto.
  await cliente
    .from("appointment_reschedules")
    .update({ estado: "RETIRADA", respondido_at: ahora })
    .eq("appointment_id", turnoId)
    .eq("estado", "PENDIENTE");

  await encolarNotificacion(cliente, {
    appointmentId: turno.id,
    tipo:
      actor.tipo === "CLIENTE" ? "TURNO_CANCELADO_POR_CLIENTE" : "TURNO_CANCELADO_POR_STAFF",
    destinatario: contraparte(actor),
    payload: {
      numero: turno.numero,
      fecha_hora_inicio: turno.fecha_hora_inicio,
      motivo: limpiar(motivo),
    },
  });

  return { ok: true, data: undefined };
}

// ---------------------------------------------------------------------
// Pedir / proponer una reprogramación
// ---------------------------------------------------------------------

export async function crearSolicitud(
  cliente: Cliente,
  p: { turnoId: string; actor: Actor; fechaHoraInicio: string; motivo?: string }
): Promise<ActionResult<{ id: string }>> {
  const { data: turno } = await cliente
    .from("appointments")
    .select(
      "id, numero, estado, fecha_hora_inicio, duracion_min, appointment_services(service_id), works(estado)"
    )
    .eq("id", p.turnoId)
    .maybeSingle();

  if (!turno) return { ok: false, error: "No encontramos el turno." };

  const modificable = turnoModificable(turno.estado, uno(turno.works)?.estado);
  if (!modificable.ok) {
    return { ok: false, error: modificable.razon ?? "Este turno no se puede modificar." };
  }

  const inicio = new Date(p.fechaHoraInicio);
  if (Number.isNaN(inicio.getTime())) {
    return { ok: false, error: "El horario elegido no es válido." };
  }
  if (inicio.getTime() === new Date(turno.fecha_hora_inicio).getTime()) {
    return { ok: false, error: "Elegí un horario distinto al actual." };
  }

  const disponible = await horarioDisponible(
    cliente,
    {
      servicioIds: (turno.appointment_services ?? []).map((s) => s.service_id),
      duracionMin: turno.duracion_min,
      excluirTurnoId: turno.id,
    },
    inicio.toISOString()
  );
  if (!disponible.ok) return disponible;

  const fin = new Date(inicio.getTime() + turno.duracion_min * 60000);

  const { data: solicitud, error } = await cliente
    .from("appointment_reschedules")
    .insert({
      appointment_id: turno.id,
      solicitado_por: p.actor.tipo,
      solicitado_por_profile_id: profileIdDe(p.actor),
      fecha_hora_inicio_anterior: turno.fecha_hora_inicio,
      fecha_hora_inicio_propuesta: inicio.toISOString(),
      fecha_hora_fin_propuesta: fin.toISOString(),
      motivo: limpiar(p.motivo),
    })
    .select("id")
    .single();

  if (error || !solicitud) {
    if (error?.code === "23505") {
      return { ok: false, error: "Este turno ya tiene una reprogramación pendiente." };
    }
    return { ok: false, error: "No se pudo registrar la reprogramación." };
  }

  await encolarNotificacion(cliente, {
    appointmentId: turno.id,
    rescheduleId: solicitud.id,
    tipo:
      p.actor.tipo === "CLIENTE"
        ? "REPROGRAMACION_SOLICITADA_POR_CLIENTE"
        : "REPROGRAMACION_PROPUESTA_POR_STAFF",
    destinatario: contraparte(p.actor),
    payload: {
      numero: turno.numero,
      fecha_hora_inicio_actual: turno.fecha_hora_inicio,
      fecha_hora_inicio_propuesta: inicio.toISOString(),
      motivo: limpiar(p.motivo),
    },
  });

  return { ok: true, data: { id: solicitud.id } };
}

// ---------------------------------------------------------------------
// Aceptar / rechazar
// ---------------------------------------------------------------------

export async function responderSolicitud(
  cliente: Cliente,
  p: {
    solicitudId: string;
    aceptar: boolean;
    actor: Actor;
    motivo?: string;
    turnoIdEsperado?: string;
  }
): Promise<ActionResult> {
  const { data: sol } = await cliente
    .from("appointment_reschedules")
    .select(
      "id, appointment_id, estado, solicitado_por, fecha_hora_inicio_propuesta, fecha_hora_fin_propuesta"
    )
    .eq("id", p.solicitudId)
    .maybeSingle();

  if (!sol || (p.turnoIdEsperado && sol.appointment_id !== p.turnoIdEsperado)) {
    return { ok: false, error: "No encontramos la solicitud." };
  }
  if (sol.estado !== "PENDIENTE") {
    return { ok: false, error: "Esta solicitud ya fue respondida." };
  }
  // Solo responde la otra parte: al cliente le responde el staff y viceversa.
  if (sol.solicitado_por === p.actor.tipo) {
    return { ok: false, error: "No podés responder tu propia solicitud." };
  }

  const { data: turno } = await cliente
    .from("appointments")
    .select(
      "id, numero, estado, fecha_hora_inicio, duracion_min, appointment_services(service_id), works(estado)"
    )
    .eq("id", sol.appointment_id)
    .maybeSingle();

  if (!turno) return { ok: false, error: "No encontramos el turno." };

  const ahora = new Date().toISOString();
  const respuesta = {
    respondido_por: p.actor.tipo,
    respondido_por_profile_id: profileIdDe(p.actor),
    respuesta_motivo: limpiar(p.motivo),
    respondido_at: ahora,
  };

  if (!p.aceptar) {
    const { data: actualizada, error } = await cliente
      .from("appointment_reschedules")
      .update({ estado: "RECHAZADA", ...respuesta })
      .eq("id", sol.id)
      .eq("estado", "PENDIENTE")
      .select("id")
      .maybeSingle();

    if (error || !actualizada) {
      return { ok: false, error: "No se pudo registrar la respuesta." };
    }
  } else {
    const modificable = turnoModificable(turno.estado, uno(turno.works)?.estado);
    if (!modificable.ok) {
      return { ok: false, error: modificable.razon ?? "Este turno no se puede modificar." };
    }

    const disponible = await horarioDisponible(
      cliente,
      {
        servicioIds: (turno.appointment_services ?? []).map((s) => s.service_id),
        duracionMin: turno.duracion_min,
        excluirTurnoId: turno.id,
      },
      sol.fecha_hora_inicio_propuesta
    );
    if (!disponible.ok) return disponible;

    // 1) Se "reclama" la solicitud para que nadie la acepte dos veces.
    const { data: reclamada } = await cliente
      .from("appointment_reschedules")
      .update({ estado: "ACEPTADA", ...respuesta })
      .eq("id", sol.id)
      .eq("estado", "PENDIENTE")
      .select("id")
      .maybeSingle();

    if (!reclamada) return { ok: false, error: "Esta solicitud ya fue respondida." };

    // 2) Se mueve el turno. Si falla, se devuelve la solicitud a PENDIENTE.
    const { data: movido, error: errorTurno } = await cliente
      .from("appointments")
      .update({
        fecha_hora_inicio: sol.fecha_hora_inicio_propuesta,
        fecha_hora_fin: sol.fecha_hora_fin_propuesta,
      })
      .eq("id", turno.id)
      .eq("estado", "CONFIRMADO")
      .select("id")
      .maybeSingle();

    if (errorTurno || !movido) {
      await cliente
        .from("appointment_reschedules")
        .update({
          estado: "PENDIENTE",
          respondido_por: null,
          respondido_por_profile_id: null,
          respuesta_motivo: null,
          respondido_at: null,
        })
        .eq("id", sol.id);

      return {
        ok: false,
        error:
          errorTurno?.code === "23P01"
            ? "El empleado asignado ya tiene otro turno en ese horario."
            : "No se pudo reprogramar el turno.",
      };
    }
  }

  await encolarNotificacion(cliente, {
    appointmentId: turno.id,
    rescheduleId: sol.id,
    tipo: p.aceptar ? "REPROGRAMACION_ACEPTADA" : "REPROGRAMACION_RECHAZADA",
    destinatario: contraparte(p.actor),
    payload: {
      numero: turno.numero,
      fecha_hora_inicio_anterior: turno.fecha_hora_inicio,
      fecha_hora_inicio_propuesta: sol.fecha_hora_inicio_propuesta,
      motivo: limpiar(p.motivo),
    },
  });

  return { ok: true, data: undefined };
}

// ---------------------------------------------------------------------
// Retirar una solicitud propia que sigue pendiente
// ---------------------------------------------------------------------

export async function retirarSolicitud(
  cliente: Cliente,
  p: { solicitudId: string; actor: Actor; turnoIdEsperado?: string }
): Promise<ActionResult> {
  let consulta = cliente
    .from("appointment_reschedules")
    .update({ estado: "RETIRADA", respondido_at: new Date().toISOString() })
    .eq("id", p.solicitudId)
    .eq("estado", "PENDIENTE")
    .eq("solicitado_por", p.actor.tipo);

  if (p.turnoIdEsperado) {
    consulta = consulta.eq("appointment_id", p.turnoIdEsperado);
  }

  const { data, error } = await consulta.select("id, appointment_id").maybeSingle();

  if (error || !data) {
    return { ok: false, error: "No se pudo retirar la solicitud." };
  }

  await encolarNotificacion(cliente, {
    appointmentId: data.appointment_id,
    rescheduleId: data.id,
    tipo: "REPROGRAMACION_RETIRADA",
    destinatario: contraparte(p.actor),
  });

  return { ok: true, data: undefined };
}