"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkAuth } from "@/lib/auth/guards";
import { calcularSlotsDelDia } from "@/lib/calculations/availability";
import { normalizarTelefono } from "@/lib/format";
import { reservaPublicaSchema, turnoInternoSchema } from "@/lib/validations/appointment";
import type { ActionResult } from "@/types/models";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type Cliente = SupabaseClient<Database>;

/** Callable por cualquiera (anónimo incluido): solo lee horarios y ocupación. */
export async function obtenerDisponibilidad(
  fechaISO: string,
  servicioIds: string[]
): Promise<ActionResult<{ slots: { horaISO: string; disponible: boolean }[]; duracionMin: number }>> {
  if (!fechaISO || servicioIds.length === 0) {
    return { ok: false, error: "Elegí al menos un servicio y una fecha." };
  }

  const supabase = await createClient();
  const diaSemana = new Date(`${fechaISO}T00:00:00`).getDay();

  const [{ data: horario }, { data: settings }, { data: servicios }] = await Promise.all([
    supabase.from("business_hours").select("*").eq("dia_semana", diaSemana).eq("activo", true).maybeSingle(),
    supabase.from("business_settings").select("*").eq("id", 1).single(),
    supabase.from("services").select("id, duracion_min, cupo_maximo").in("id", servicioIds),
  ]);

  if (!horario) {
    return { ok: true, data: { slots: [], duracionMin: 0 } };
  }
  if (!settings) {
    return { ok: false, error: "No se pudo leer la configuración del negocio." };
  }
  if (!servicios || servicios.length !== servicioIds.length) {
    return { ok: false, error: "Alguno de los servicios elegidos no existe." };
  }

  const duracionMin = servicios.reduce((acc, s) => acc + s.duracion_min, 0);

  const [{ data: ocupados }, { data: bloqueos }] = await Promise.all([
    supabase.rpc("turnos_ocupados_dia", { p_fecha: fechaISO }),
    supabase.rpc("bloqueos_dia", { p_fecha: fechaISO }),
  ]);

  const slots = calcularSlotsDelDia({
    fechaISO,
    duracionMin,
    horaApertura: horario.hora_apertura,
    horaCierre: horario.hora_cierre,
    intervaloMin: settings.intervalo_turnos_min,
    capacidad: settings.capacidad_simultanea,
    servicios: servicios.map((s) => ({ id: s.id, cupoMaximo: s.cupo_maximo })),
    turnosOcupados: (ocupados ?? []).map((o) => ({
      inicio: new Date(o.fecha_hora_inicio),
      fin: new Date(o.fecha_hora_fin),
      servicioIds: o.servicio_ids ?? [],
    })),
    bloqueos: (bloqueos ?? []).map((b) => ({
      inicio: new Date(b.fecha_inicio),
      fin: new Date(b.fecha_fin),
    })),
  });

  return {
    ok: true,
    data: {
      slots: slots.map((s) => ({ horaISO: s.inicio.toISOString(), disponible: s.disponible })),
      duracionMin,
    },
  };
}

/**
 * Vuelve a validar capacidad general y cupo por servicio justo antes de
 * insertar, para evitar que dos personas tomen el mismo hueco casi a la vez.
 * Se usa tanto en la reserva pública como en la interna.
 */
async function verificarHorarioDisponible(
  cliente: Cliente,
  fechaISO: string,
  inicio: Date,
  fin: Date,
  servicioIds: string[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  const [{ data: settings }, { data: serviciosInfo }, { data: ocupados }] = await Promise.all([
    cliente.from("business_settings").select("capacidad_simultanea").eq("id", 1).single(),
    cliente.from("services").select("id, cupo_maximo").in("id", servicioIds),
    cliente.rpc("turnos_ocupados_dia", { p_fecha: fechaISO }),
  ]);

  if (!settings) {
    return { ok: false, error: "No se pudo leer la configuración del negocio." };
  }

  const solapados = (ocupados ?? []).filter((o) => {
    const oIni = new Date(o.fecha_hora_inicio);
    const oFin = new Date(o.fecha_hora_fin);
    return inicio < oFin && oIni < fin;
  });

  if (solapados.length >= settings.capacidad_simultanea) {
    return { ok: false, error: "Ese horario ya no está disponible. Elegí otro." };
  }

  for (const s of serviciosInfo ?? []) {
    if (s.cupo_maximo == null) continue;
    const ocupadosDeEsteServicio = solapados.filter((o) =>
      (o.servicio_ids ?? []).includes(s.id)
    ).length;
    if (ocupadosDeEsteServicio >= s.cupo_maximo) {
      return {
        ok: false,
        error: "Ese horario ya no tiene cupo para uno de los servicios elegidos. Elegí otro.",
      };
    }
  }

  return { ok: true };
}

/** Reserva pública: usa service_role porque el cliente no tiene sesión. */
export async function crearTurnoPublico(
  valores: unknown
): Promise<ActionResult<{ numero: number }>> {
  const parsed = reservaPublicaSchema.safeParse(valores);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisá los datos del formulario.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { nombre, apellido, telefono, email, servicioIds, fechaHoraInicio, comentario } = parsed.data;
  const admin = createAdminClient();

  const telefonoNorm = normalizarTelefono(telefono);
  const { data: clienteExistente } = await admin
    .from("clients")
    .select("id")
    .eq("telefono_norm", telefonoNorm)
    .maybeSingle();

  let clientId = clienteExistente?.id as string | undefined;

  if (!clientId) {
    const { data: nuevoCliente, error: errorCliente } = await admin
      .from("clients")
      .insert({ nombre, apellido, telefono, email: email || null })
      .select("id")
      .single();

    if (errorCliente || !nuevoCliente) {
      return { ok: false, error: "No se pudo registrar el cliente." };
    }
    clientId = nuevoCliente.id;
  }

  const { data: servicios, error: errorServicios } = await admin
    .from("services")
    .select("id, precio, duracion_min")
    .in("id", servicioIds)
    .eq("activo", true);

  if (errorServicios || !servicios || servicios.length !== servicioIds.length) {
    return { ok: false, error: "Alguno de los servicios elegidos ya no está disponible." };
  }

  const duracionTotal = servicios.reduce((acc, s) => acc + s.duracion_min, 0);
  const inicio = new Date(fechaHoraInicio);
  const fin = new Date(inicio.getTime() + duracionTotal * 60000);
  const fechaISO = fechaHoraInicio.slice(0, 10);

  const check = await verificarHorarioDisponible(admin, fechaISO, inicio, fin, servicioIds);
  if (!check.ok) return check;

  const { data: turno, error: errorTurno } = await admin
    .from("appointments")
    .insert({
      client_id: clientId,
      fecha_hora_inicio: inicio.toISOString(),
      fecha_hora_fin: fin.toISOString(),
      duracion_min: duracionTotal,
      comentario_cliente: comentario || null,
      origen: "PUBLICO",
      estado: "CONFIRMADO",
    })
    .select("id, numero")
    .single();

  if (errorTurno || !turno) {
    return { ok: false, error: "No se pudo reservar el turno." };
  }

  const { error: errorItems } = await admin.from("appointment_services").insert(
    servicios.map((s) => ({
      appointment_id: turno.id,
      service_id: s.id,
      precio_snapshot: s.precio,
      duracion_snapshot: s.duracion_min,
    }))
  );

  if (errorItems) {
    return { ok: false, error: "El turno se creó pero hubo un problema con los servicios. Contactanos." };
  }

  return { ok: true, data: { numero: turno.numero } };
}

/** Turno cargado por un empleado desde el panel. */
export async function crearTurnoInterno(
  valores: unknown
): Promise<ActionResult<{ id: string }>> {
  const perfil = await checkAuth();
  if (!perfil) return { ok: false, error: "No autorizado." };

  const parsed = turnoInternoSchema.safeParse(valores);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisá los datos del formulario.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { clientId, servicioIds, fechaHoraInicio, asignarme, comentario } = parsed.data;
  const supabase = await createClient();

  const { data: servicios, error: errorServicios } = await supabase
    .from("services")
    .select("id, precio, duracion_min")
    .in("id", servicioIds);

  if (errorServicios || !servicios || servicios.length !== servicioIds.length) {
    return { ok: false, error: "Alguno de los servicios elegidos no existe." };
  }

  const duracionTotal = servicios.reduce((acc, s) => acc + s.duracion_min, 0);
  const inicio = new Date(fechaHoraInicio);
  const fin = new Date(inicio.getTime() + duracionTotal * 60000);
  const fechaISO = fechaHoraInicio.slice(0, 10);

  const check = await verificarHorarioDisponible(supabase, fechaISO, inicio, fin, servicioIds);
  if (!check.ok) return check;

  const { data: turno, error: errorTurno } = await supabase
    .from("appointments")
    .insert({
      client_id: clientId,
      profile_id: asignarme ? perfil.id : null,
      fecha_hora_inicio: inicio.toISOString(),
      fecha_hora_fin: fin.toISOString(),
      duracion_min: duracionTotal,
      comentario_cliente: comentario || null,
      origen: "INTERNO",
      estado: "CONFIRMADO",
    })
    .select("id")
    .single();

  if (errorTurno || !turno) {
    if (errorTurno?.code === "23P01") {
      return { ok: false, error: "Ya tenés un turno en ese horario." };
    }
    return { ok: false, error: "No se pudo crear el turno." };
  }

  const { error: errorItems } = await supabase.from("appointment_services").insert(
    servicios.map((s) => ({
      appointment_id: turno.id,
      service_id: s.id,
      precio_snapshot: s.precio,
      duracion_snapshot: s.duracion_min,
    }))
  );

  if (errorItems) {
    return { ok: false, error: "El turno se creó pero hubo un problema con los servicios." };
  }

  revalidatePath("/agenda");
  return { ok: true, data: { id: turno.id } };
}

export async function cancelarTurno(id: string): Promise<ActionResult> {
  const perfil = await checkAuth();
  if (!perfil) return { ok: false, error: "No autorizado." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("appointments")
    .update({ estado: "CANCELADO" })
    .eq("id", id);

  if (error) return { ok: false, error: "No se pudo cancelar el turno." };

  revalidatePath("/agenda");
  return { ok: true, data: undefined };
}