"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkAuth } from "@/lib/auth/guards";
import { calcularSlotsDelDia } from "@/lib/calculations/availability";
import { normalizarTelefono } from "@/lib/format";
import { reservaPublicaSchema, turnoInternoSchema } from "@/lib/validations/appointment";
import { motivoSchema } from "@/lib/validations/reprogramacion";
import { cancelarTurnoComun } from "@/lib/turnos/operaciones";
import type { ActionResult } from "@/types/models";

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
      slots: slots
        .filter((s) => s.inicio.getTime() > Date.now()) // no se ofrecen horarios que ya pasaron
        .map((s) => ({ horaISO: s.inicio.toISOString(), disponible: s.disponible })),
      duracionMin,
    },
  };
}

/**
 * Vuelve a validar capacidad general y cupo por servicio justo antes de
 * insertar. `cliente` puede ser el cliente normal o el admin (service_role).
 */
async function verificarHorarioDisponible(
  cliente: any,
  fechaISO: string,
  inicio: Date,
  fin: Date,
  servicioIds: string[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (Number.isNaN(inicio.getTime()) || inicio.getTime() <= Date.now()) {
    return { ok: false, error: "No se pueden sacar turnos en una fecha u hora que ya pasó." };
  }

  const [{ data: settings }, { data: serviciosInfo }, { data: ocupados }] = await Promise.all([
    cliente.from("business_settings").select("capacidad_simultanea").eq("id", 1).single(),
    cliente.from("services").select("id, cupo_maximo").in("id", servicioIds),
    cliente.rpc("turnos_ocupados_dia", { p_fecha: fechaISO }),
  ]);

  if (!settings) {
    return { ok: false, error: "No se pudo leer la configuración del negocio." };
  }

  const solapados = (ocupados ?? []).filter((o: any) => {
    const oIni = new Date(o.fecha_hora_inicio);
    const oFin = new Date(o.fecha_hora_fin);
    return inicio < oFin && oIni < fin;
  });

  if (solapados.length >= settings.capacidad_simultanea) {
    return { ok: false, error: "Ese horario ya no está disponible. Elegí otro." };
  }

  for (const s of serviciosInfo ?? []) {
    if (s.cupo_maximo == null) continue;
    const ocupadosDeEsteServicio = solapados.filter((o: any) =>
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

export async function crearTurnoPublico(
  valores: unknown
): Promise<ActionResult<{ numero: number; token: string; codigo: string }>> {
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
    .select("id, numero, token_gestion, codigo")
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

  const totalTrabajo = servicios.reduce((acc, s) => acc + Number(s.precio), 0);
  const { data: trabajo, error: errorTrabajo } = await admin
    .from("works")
    .insert({ client_id: clientId, appointment_id: turno.id, total: totalTrabajo })
    .select("id")
    .single();

  if (errorTrabajo || !trabajo) {
    return { ok: false, error: "El turno se creó pero hubo un problema al generar el trabajo. Contactanos." };
  }

  const { error: errorWorkItems } = await admin.from("work_items").insert(
    servicios.map((s) => ({ work_id: trabajo.id, service_id: s.id, precio_snapshot: s.precio }))
  );

  if (errorWorkItems) {
    return { ok: false, error: "El turno se creó pero hubo un problema al generar el trabajo. Contactanos." };
  }

  return {
    ok: true,
    data: { numero: turno.numero, token: turno.token_gestion, codigo: turno.codigo },
  };
}

export async function crearTurnoInterno(
  valores: unknown
): Promise<ActionResult<{ id: string; numero: number; codigo: string }>> {
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

  const { clientId, servicioIds, fechaHoraInicio, asignarme, comentario, budgetId } = parsed.data;
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
      budget_id: budgetId || null,
    })
    .select("id, numero, codigo")
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

  const totalTrabajo = servicios.reduce((acc, s) => acc + Number(s.precio), 0);
  const { data: trabajo, error: errorTrabajo } = await supabase
    .from("works")
    .insert({
      client_id: clientId,
      appointment_id: turno.id,
      budget_id: budgetId || null,
      total: totalTrabajo,
      ...(asignarme
        ? { profile_id: perfil.id, estado: "TOMADO", fecha_inicio: new Date().toISOString() }
        : {}),
    })
    .select("id")
    .single();

  if (errorTrabajo || !trabajo) {
    return { ok: false, error: "El turno se creó pero hubo un problema al generar el trabajo." };
  }

  const { error: errorWorkItems } = await supabase.from("work_items").insert(
    servicios.map((s) => ({ work_id: trabajo.id, service_id: s.id, precio_snapshot: s.precio }))
  );

  if (errorWorkItems) {
    return { ok: false, error: "El turno se creó pero hubo un problema al generar el trabajo." };
  }

  revalidatePath("/agenda");
  revalidatePath("/trabajos");
  revalidatePath("/trabajos/disponibles");
  return { ok: true, data: { id: turno.id, numero: turno.numero, codigo: turno.codigo } };
}

export async function cancelarTurno(id: string, motivo?: string): Promise<ActionResult> {
  const perfil = await checkAuth();
  if (!perfil) return { ok: false, error: "No autorizado." };

  const m = motivoSchema.safeParse(motivo ?? "");
  if (!m.success) {
    return { ok: false, error: "El motivo puede tener hasta 500 caracteres." };
  }

  const supabase = await createClient();
  const res = await cancelarTurnoComun(
    supabase,
    id,
    { tipo: "STAFF", profileId: perfil.id },
    m.data
  );
  if (!res.ok) return res;

  revalidatePath("/agenda");
  revalidatePath("/trabajos");
  revalidatePath("/trabajos/disponibles");
  return { ok: true, data: undefined };
}