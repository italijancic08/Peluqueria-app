import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

const TOKEN_RE = /^[a-f0-9]{64}$/;
const ESTADOS_TRABAJO_EN_MARCHA = ["EN_CURSO", "FINALIZADO", "COBRADO"];

export type Evaluacion = { ok: boolean; razon: string | null };

/** Helper: Supabase devuelve una relación como objeto o como arreglo según el caso. */
export function uno<T>(valor: T | T[] | null | undefined): T | null {
  if (Array.isArray(valor)) return valor[0] ?? null;
  return valor ?? null;
}

/** ¿El turno todavía se puede mover o cancelar? (aplica a cliente y staff) */
export function turnoModificable(
  estadoTurno: string,
  estadoTrabajo: string | null | undefined
): Evaluacion {
  if (estadoTurno !== "CONFIRMADO") {
    return { ok: false, razon: "Este turno ya no se puede modificar." };
  }
  if (estadoTrabajo && ESTADOS_TRABAJO_EN_MARCHA.includes(estadoTrabajo)) {
    return { ok: false, razon: "Este turno ya está en marcha y no se puede modificar." };
  }
  return { ok: true, razon: null };
}

/** Reglas extra para el cliente: respetar la anticipación mínima. */
export function evaluarGestionCliente(p: {
  estadoTurno: string;
  estadoTrabajo: string | null;
  inicio: string;
  ahora: number;
  anticipacionHoras: number;
}): Evaluacion {
  const base = turnoModificable(p.estadoTurno, p.estadoTrabajo);
  if (!base.ok) return base;

  const horas = (new Date(p.inicio).getTime() - p.ahora) / 3_600_000;
  if (horas <= 0) {
    return { ok: false, razon: "Este turno ya pasó." };
  }
  if (horas < p.anticipacionHoras) {
    return {
      ok: false,
      razon: `Solo se puede cancelar o reprogramar con al menos ${p.anticipacionHoras} h de anticipación. Comunicate con nosotros.`,
    };
  }
  return { ok: true, razon: null };
}

export type SolicitudVista = {
  id: string;
  estado: string;
  solicitado_por: string;
  fecha_hora_inicio_propuesta: string;
  motivo: string | null;
  respuesta_motivo: string | null;
  respondido_por: string | null;
  created_at: string;
};

export type TurnoGestion = {
  id: string;
  numero: number;
  estado: string;
  inicio: string;
  fin: string;
  duracionMin: number;
  canceladoPor: string | null;
  motivoCancelacion: string | null;
  nombreCliente: string;
  servicios: string[];
  estadoTrabajo: string | null;
  pendiente: SolicitudVista | null;
  ultimaResuelta: SolicitudVista | null;
  anticipacionHoras: number;
  gestion: Evaluacion;
};

/** Carga un turno por su token secreto (usa service_role: el token ES la credencial). */
export async function cargarTurnoPorToken(token: string): Promise<TurnoGestion | null> {
  if (!TOKEN_RE.test(token)) return null;
  const admin = createAdminClient();

  const { data: turno } = await admin
    .from("appointments")
    .select(
      `id, numero, estado, fecha_hora_inicio, fecha_hora_fin, duracion_min,
       cancelado_por, motivo_cancelacion,
       clients ( nombre ),
       appointment_services ( service_id, services ( nombre ) ),
       works ( estado ),
       appointment_reschedules (
         id, estado, solicitado_por, fecha_hora_inicio_propuesta,
         motivo, respuesta_motivo, respondido_por, created_at
       )`
    )
    .eq("token_gestion", token)
    .maybeSingle();

  if (!turno) return null;

  const { data: settings } = await admin
    .from("business_settings")
    .select("anticipacion_cliente_horas")
    .eq("id", 1)
    .single();
  const anticipacionHoras = settings?.anticipacion_cliente_horas ?? 2;

  const estadoTrabajo = uno(turno.works)?.estado ?? null;

  const solicitudes = [...(turno.appointment_reschedules ?? [])].sort((a, b) =>
    b.created_at.localeCompare(a.created_at)
  );
  const pendiente = solicitudes.find((s) => s.estado === "PENDIENTE") ?? null;
  const ultimaResuelta = solicitudes.find((s) => s.estado !== "PENDIENTE") ?? null;

  const servicios = (turno.appointment_services ?? [])
    .map((s) => uno(s.services)?.nombre)
    .filter((n): n is string => Boolean(n));

  return {
    id: turno.id,
    numero: turno.numero,
    estado: turno.estado,
    inicio: turno.fecha_hora_inicio,
    fin: turno.fecha_hora_fin,
    duracionMin: turno.duracion_min,
    canceladoPor: turno.cancelado_por,
    motivoCancelacion: turno.motivo_cancelacion,
    nombreCliente: uno(turno.clients)?.nombre ?? "",
    servicios,
    estadoTrabajo,
    pendiente,
    ultimaResuelta,
    anticipacionHoras,
    gestion: evaluarGestionCliente({
      estadoTurno: turno.estado,
      estadoTrabajo,
      inicio: turno.fecha_hora_inicio,
      ahora: Date.now(),
      anticipacionHoras,
    }),
  };
}