"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkAuth } from "@/lib/auth/guards";
import { cargarTurnoPorToken } from "@/lib/turnos/gestion";
import { slotsDeTurno, type SlotDisponible } from "@/lib/turnos/slots";
import {
  cancelarTurnoComun,
  crearSolicitud,
  responderSolicitud,
  retirarSolicitud,
} from "@/lib/turnos/operaciones";
import {
  fechaHoraSchema,
  fechaISOSchema,
  idSchema,
  motivoSchema,
  tokenSchema,
} from "@/lib/validations/reprogramacion";
import type { ActionResult } from "@/types/models";

const ERROR_MOTIVO = "El motivo puede tener hasta 500 caracteres.";

function refrescarStaff() {
  revalidatePath("/agenda");
  revalidatePath("/trabajos");
  revalidatePath("/trabajos/disponibles");
}

// =====================================================================
// CLIENTE (sin sesión: la credencial es el token del turno)
// =====================================================================

async function turnoDelToken(token: string) {
  const t = tokenSchema.safeParse(token);
  if (!t.success) return null;
  return cargarTurnoPorToken(t.data);
}

function refrescarCliente(token: string) {
  revalidatePath(`/turnos/gestionar/${token}`);
  refrescarStaff();
}

export async function slotsParaToken(
  token: string,
  fechaISO: string
): Promise<ActionResult<SlotDisponible[]>> {
  const turno = await turnoDelToken(token);
  if (!turno) return { ok: false, error: "No encontramos este turno." };
  if (!turno.gestion.ok) {
    return { ok: false, error: turno.gestion.razon ?? "Este turno no se puede modificar." };
  }

  const f = fechaISOSchema.safeParse(fechaISO);
  if (!f.success) return { ok: false, error: "Fecha inválida." };

  return slotsDeTurno(createAdminClient(), turno.id, f.data);
}

export async function cancelarTurnoPorCliente(
  token: string,
  motivo?: string
): Promise<ActionResult> {
  const turno = await turnoDelToken(token);
  if (!turno) return { ok: false, error: "No encontramos este turno." };
  if (!turno.gestion.ok) {
    return { ok: false, error: turno.gestion.razon ?? "Este turno no se puede cancelar." };
  }

  const m = motivoSchema.safeParse(motivo ?? "");
  if (!m.success) return { ok: false, error: ERROR_MOTIVO };

  const res = await cancelarTurnoComun(createAdminClient(), turno.id, { tipo: "CLIENTE" }, m.data);
  if (res.ok) refrescarCliente(token);
  return res;
}

export async function solicitarReprogramacionCliente(
  token: string,
  fechaHoraInicio: string,
  motivo?: string
): Promise<ActionResult<{ id: string }>> {
  const turno = await turnoDelToken(token);
  if (!turno) return { ok: false, error: "No encontramos este turno." };
  if (!turno.gestion.ok) {
    return { ok: false, error: turno.gestion.razon ?? "Este turno no se puede reprogramar." };
  }
  if (turno.pendiente) {
    return { ok: false, error: "Ya hay una reprogramación pendiente para este turno." };
  }

  const h = fechaHoraSchema.safeParse(fechaHoraInicio);
  if (!h.success) return { ok: false, error: "Elegí un nuevo horario." };
  const m = motivoSchema.safeParse(motivo ?? "");
  if (!m.success) return { ok: false, error: ERROR_MOTIVO };

  const res = await crearSolicitud(createAdminClient(), {
    turnoId: turno.id,
    actor: { tipo: "CLIENTE" },
    fechaHoraInicio: h.data,
    motivo: m.data,
  });
  if (res.ok) refrescarCliente(token);
  return res;
}

export async function retirarSolicitudCliente(token: string): Promise<ActionResult> {
  const turno = await turnoDelToken(token);
  if (!turno) return { ok: false, error: "No encontramos este turno." };
  if (!turno.pendiente || turno.pendiente.solicitado_por !== "CLIENTE") {
    return { ok: false, error: "No hay ninguna solicitud tuya pendiente." };
  }

  const res = await retirarSolicitud(createAdminClient(), {
    solicitudId: turno.pendiente.id,
    actor: { tipo: "CLIENTE" },
    turnoIdEsperado: turno.id,
  });
  if (res.ok) refrescarCliente(token);
  return res;
}

/** El cliente acepta o rechaza el horario que le propuso el staff. */
export async function responderPropuestaCliente(
  token: string,
  aceptar: boolean,
  motivo?: string
): Promise<ActionResult> {
  const turno = await turnoDelToken(token);
  if (!turno) return { ok: false, error: "No encontramos este turno." };
  if (!turno.pendiente || turno.pendiente.solicitado_por !== "STAFF") {
    return { ok: false, error: "No hay ninguna propuesta pendiente." };
  }

  const m = motivoSchema.safeParse(motivo ?? "");
  if (!m.success) return { ok: false, error: ERROR_MOTIVO };

  const res = await responderSolicitud(createAdminClient(), {
    solicitudId: turno.pendiente.id,
    aceptar,
    actor: { tipo: "CLIENTE" },
    motivo: m.data,
    turnoIdEsperado: turno.id,
  });
  if (res.ok) refrescarCliente(token);
  return res;
}

// =====================================================================
// STAFF (empleados y administradores, con sesión)
// =====================================================================

export async function slotsParaTurno(
  turnoId: string,
  fechaISO: string
): Promise<ActionResult<SlotDisponible[]>> {
  const perfil = await checkAuth();
  if (!perfil) return { ok: false, error: "No autorizado." };

  const id = idSchema.safeParse(turnoId);
  const f = fechaISOSchema.safeParse(fechaISO);
  if (!id.success || !f.success) return { ok: false, error: "Datos inválidos." };

  const supabase = await createClient();
  return slotsDeTurno(supabase, id.data, f.data);
}

/** El staff propone un nuevo horario: el cliente tiene que aceptarlo o rechazarlo. */
export async function proponerReprogramacion(
  turnoId: string,
  fechaHoraInicio: string,
  motivo?: string
): Promise<ActionResult<{ id: string }>> {
  const perfil = await checkAuth();
  if (!perfil) return { ok: false, error: "No autorizado." };

  const id = idSchema.safeParse(turnoId);
  const h = fechaHoraSchema.safeParse(fechaHoraInicio);
  if (!id.success) return { ok: false, error: "Turno inválido." };
  if (!h.success) return { ok: false, error: "Elegí un nuevo horario." };
  const m = motivoSchema.safeParse(motivo ?? "");
  if (!m.success) return { ok: false, error: ERROR_MOTIVO };

  const supabase = await createClient();
  const res = await crearSolicitud(supabase, {
    turnoId: id.data,
    actor: { tipo: "STAFF", profileId: perfil.id },
    fechaHoraInicio: h.data,
    motivo: m.data,
  });
  if (res.ok) refrescarStaff();
  return res;
}

/** El staff acepta o rechaza el pedido de reprogramación de un cliente. */
export async function responderSolicitudStaff(
  solicitudId: string,
  aceptar: boolean,
  motivo?: string
): Promise<ActionResult> {
  const perfil = await checkAuth();
  if (!perfil) return { ok: false, error: "No autorizado." };

  const id = idSchema.safeParse(solicitudId);
  if (!id.success) return { ok: false, error: "Solicitud inválida." };
  const m = motivoSchema.safeParse(motivo ?? "");
  if (!m.success) return { ok: false, error: ERROR_MOTIVO };

  const supabase = await createClient();
  const res = await responderSolicitud(supabase, {
    solicitudId: id.data,
    aceptar,
    actor: { tipo: "STAFF", profileId: perfil.id },
    motivo: m.data,
  });
  if (res.ok) refrescarStaff();
  return res;
}

/** El staff retira una propuesta suya que el cliente todavía no respondió. */
export async function retirarPropuestaStaff(solicitudId: string): Promise<ActionResult> {
  const perfil = await checkAuth();
  if (!perfil) return { ok: false, error: "No autorizado." };

  const id = idSchema.safeParse(solicitudId);
  if (!id.success) return { ok: false, error: "Solicitud inválida." };

  const supabase = await createClient();
  const res = await retirarSolicitud(supabase, {
    solicitudId: id.data,
    actor: { tipo: "STAFF", profileId: perfil.id },
  });
  if (res.ok) refrescarStaff();
  return res;
}