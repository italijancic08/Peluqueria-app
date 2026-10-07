import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { calcularSlotsDelDia } from "@/lib/calculations/availability";
import { mostrarFecha } from "@/lib/dates";
import type { Database } from "@/types/database";
import type { ActionResult } from "@/types/models";

type Cliente = SupabaseClient<Database>;

export type SlotDisponible = { horaISO: string; disponible: boolean };

type Params = {
  fechaISO: string;
  servicioIds: string[];
  duracionMin: number;
  excluirTurnoId: string;
};

export async function slotsDisponibles(
  cliente: Cliente,
  p: Params
): Promise<ActionResult<SlotDisponible[]>> {
  const { fechaISO, servicioIds, duracionMin, excluirTurnoId } = p;
  const diaSemana = new Date(`${fechaISO}T12:00:00Z`).getUTCDay();

  const [{ data: horario }, { data: settings }, { data: servicios }] = await Promise.all([
    cliente
      .from("business_hours")
      .select("*")
      .eq("dia_semana", diaSemana)
      .eq("activo", true)
      .maybeSingle(),
    cliente.from("business_settings").select("*").eq("id", 1).single(),
    cliente.from("services").select("id, cupo_maximo").in("id", servicioIds),
  ]);

  if (!horario) return { ok: true, data: [] };
  if (!settings) {
    return { ok: false, error: "No se pudo leer la configuración del negocio." };
  }

  // Argentina no usa horario de verano: el offset es siempre -03:00.
  const [{ data: ocupados }, { data: bloqueos }] = await Promise.all([
    cliente
      .from("appointments")
      .select("fecha_hora_inicio, fecha_hora_fin, appointment_services(service_id)")
      .not("estado", "in", "(CANCELADO,AUSENTE)")
      .neq("id", excluirTurnoId)
      .gte("fecha_hora_inicio", `${fechaISO}T00:00:00-03:00`)
      .lte("fecha_hora_inicio", `${fechaISO}T23:59:59.999-03:00`),
    cliente.rpc("bloqueos_dia", { p_fecha: fechaISO }),
  ]);

  const slots = calcularSlotsDelDia({
    fechaISO,
    duracionMin,
    horaApertura: horario.hora_apertura,
    horaCierre: horario.hora_cierre,
    intervaloMin: settings.intervalo_turnos_min,
    capacidad: settings.capacidad_simultanea,
    servicios: (servicios ?? []).map((s) => ({ id: s.id, cupoMaximo: s.cupo_maximo })),
    turnosOcupados: (ocupados ?? []).map((o) => ({
      inicio: new Date(o.fecha_hora_inicio),
      fin: new Date(o.fecha_hora_fin),
      servicioIds: (o.appointment_services ?? []).map((s) => s.service_id),
    })),
    bloqueos: (bloqueos ?? []).map((b) => ({
      inicio: new Date(b.fecha_inicio),
      fin: new Date(b.fecha_fin),
    })),
  });

  return {
    ok: true,
    data: slots
      .filter((s) => s.inicio.getTime() > Date.now())
      .map((s) => ({ horaISO: s.inicio.toISOString(), disponible: s.disponible })),
  };
}

/** Horarios libres para mover un turno existente (se excluye a sí mismo). */
export async function slotsDeTurno(
  cliente: Cliente,
  turnoId: string,
  fechaISO: string
): Promise<ActionResult<SlotDisponible[]>> {
  const { data: turno } = await cliente
    .from("appointments")
    .select("id, duracion_min, appointment_services(service_id)")
    .eq("id", turnoId)
    .maybeSingle();

  if (!turno) return { ok: false, error: "No encontramos el turno." };

  return slotsDisponibles(cliente, {
    fechaISO,
    servicioIds: (turno.appointment_services ?? []).map((s) => s.service_id),
    duracionMin: turno.duracion_min,
    excluirTurnoId: turno.id,
  });
}

/**
 * Confirma que `inicioISO` sigue siendo un horario válido y libre
 * (dentro del horario del local, sin bloqueos, con capacidad y cupo).
 */
export async function horarioDisponible(
  cliente: Cliente,
  p: Omit<Params, "fechaISO">,
  inicioISO: string
): Promise<ActionResult<void>> {
  const inicio = new Date(inicioISO);
  if (Number.isNaN(inicio.getTime())) {
    return { ok: false, error: "El horario elegido no es válido." };
  }
  if (inicio.getTime() <= Date.now()) {
    return { ok: false, error: "No se puede elegir un horario que ya pasó." };
  }

  const fechaISO = mostrarFecha(inicio, "yyyy-MM-dd");
  const res = await slotsDisponibles(cliente, { ...p, fechaISO });
  if (!res.ok) return res;

  const slot = res.data.find((s) => s.horaISO === inicio.toISOString());
  if (!slot || !slot.disponible) {
    return { ok: false, error: "Ese horario ya no está disponible. Elegí otro." };
  }
  return { ok: true, data: undefined };
}