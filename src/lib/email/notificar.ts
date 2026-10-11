import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { uno } from "@/lib/turnos/gestion";
import { generarPdfComprobante } from "@/lib/pdf/comprobante";
import { generarPdfPresupuesto } from "@/lib/pdf/presupuesto";
import type { Database } from "@/types/database";
import { enviarEmail, registrarEmailLog } from "./enviar";
import type { TipoEmail } from "./tipos";
import {
  plantillaComprobante,
  plantillaPresupuesto,
  plantillaReprogramacionConfirmada,
  plantillaReprogramacionPropuesta,
  plantillaReprogramacionRechazada,
  plantillaReprogramacionSolicitada,
  plantillaTurnoCancelado,
} from "./plantillas";

type Admin = SupabaseClient<Database>;

type Cliente = {
  id: string;
  nombre: string;
  apellido: string;
  email: string | null;
} | null;

function nombreCompleto(c: Cliente): string {
  return c ? `${c.nombre} ${c.apellido}`.trim() : "";
}

function baseUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.URL;
  return url ? url.replace(/\/+$/, "") : null;
}

async function nombreNegocio(admin: Admin): Promise<string> {
  const { data } = await admin
    .from("business_settings")
    .select("nombre_negocio")
    .eq("id", 1)
    .maybeSingle();
  return data?.nombre_negocio?.trim() || "Peluquería";
}

function numero4(n: number) {
  return String(n).padStart(4, "0");
}

/** Ejecuta el armado del mail y, si algo falla antes de enviar, lo deja registrado. */
async function protegido(
  ctx: {
    tipo: TipoEmail;
    referencia: string;
    appointmentId?: string;
    workId?: string;
    budgetId?: string;
  },
  fn: () => Promise<void>
): Promise<void> {
  try {
    await fn();
  } catch (e) {
    console.error(`[email] ${ctx.tipo}:`, e);
    await registrarEmailLog({
      tipo: ctx.tipo,
      estado: "FALLIDO",
      referencia: ctx.referencia,
      appointmentId: ctx.appointmentId,
      workId: ctx.workId,
      budgetId: ctx.budgetId,
      motivo: `No se pudo preparar el mail: ${e instanceof Error ? e.message : String(e)}`,
    });
  }
}

// ---------------------------------------------------------------------
// Comprobante (factura de un trabajo cobrado)
// ---------------------------------------------------------------------

export async function enviarComprobantePorEmail(workId: string): Promise<void> {
  await protegido({ tipo: "COMPROBANTE", referencia: "Comprobante", workId }, async () => {
    const admin = createAdminClient();

    const { data: trabajo } = await admin
      .from("works")
      .select(
        `id, numero, total, created_at,
         clients ( id, nombre, apellido, email ),
         work_items ( services ( nombre ) )`
      )
      .eq("id", workId)
      .maybeSingle();

    if (!trabajo) throw new Error("No se encontró el trabajo.");

    const cliente = uno(trabajo.clients) as Cliente;
    const referencia = `Comprobante N° ${numero4(trabajo.numero)}`;
    const servicios = (trabajo.work_items ?? [])
      .map((i) => uno(i.services)?.nombre)
      .filter((n): n is string => Boolean(n));

    const pdf = await generarPdfComprobante(admin, workId);

    const plantilla = plantillaComprobante({
      nombreNegocio: await nombreNegocio(admin),
      nombreCliente: cliente?.nombre ?? "",
      numero: trabajo.numero,
      fecha: trabajo.created_at,
      total: Number(trabajo.total),
      servicios,
    });

    await enviarEmail({
      tipo: "COMPROBANTE",
      para: cliente?.email,
      asunto: plantilla.asunto,
      html: plantilla.html,
      adjuntos: pdf.ok
        ? [{ filename: pdf.nombreArchivo, content: Buffer.from(pdf.bytes) }]
        : undefined,
      aviso: pdf.ok ? null : "Enviado sin adjunto: no se pudo generar el PDF.",
      cliente: { nombre: nombreCompleto(cliente) },
      clientId: cliente?.id,
      referencia,
      workId,
    });
  });
}

// ---------------------------------------------------------------------
// Presupuesto
// ---------------------------------------------------------------------

export async function enviarPresupuestoPorEmail(budgetId: string): Promise<void> {
  await protegido({ tipo: "PRESUPUESTO", referencia: "Presupuesto", budgetId }, async () => {
    const admin = createAdminClient();

    const { data: presupuesto } = await admin
      .from("budgets")
      .select(
        `id, numero, total, notas, created_at,
         clients ( id, nombre, apellido, email ),
         budget_items ( services ( nombre ) )`
      )
      .eq("id", budgetId)
      .maybeSingle();

    if (!presupuesto) throw new Error("No se encontró el presupuesto.");

    const cliente = uno(presupuesto.clients) as Cliente;
    const referencia = `Presupuesto N° ${numero4(presupuesto.numero)}`;
    const servicios = (presupuesto.budget_items ?? [])
      .map((i) => uno(i.services)?.nombre)
      .filter((n): n is string => Boolean(n));

    const pdf = await generarPdfPresupuesto(admin, budgetId);

    const plantilla = plantillaPresupuesto({
      nombreNegocio: await nombreNegocio(admin),
      nombreCliente: cliente?.nombre ?? "",
      numero: presupuesto.numero,
      fecha: presupuesto.created_at,
      total: Number(presupuesto.total),
      servicios,
      notas: presupuesto.notas,
    });

    await enviarEmail({
      tipo: "PRESUPUESTO",
      para: cliente?.email,
      asunto: plantilla.asunto,
      html: plantilla.html,
      adjuntos: pdf.ok
        ? [{ filename: pdf.nombreArchivo, content: Buffer.from(pdf.bytes) }]
        : undefined,
      aviso: pdf.ok ? null : "Enviado sin adjunto: no se pudo generar el PDF.",
      cliente: { nombre: nombreCompleto(cliente) },
      clientId: cliente?.id,
      referencia,
      budgetId,
    });
  });
}

// ---------------------------------------------------------------------
// Turnos: cancelación y reprogramación
// ---------------------------------------------------------------------

async function cargarTurno(admin: Admin, turnoId: string) {
  const { data: turno } = await admin
    .from("appointments")
    .select(
      `id, numero, fecha_hora_inicio, token_gestion,
       clients ( id, nombre, apellido, email ),
       appointment_services ( services ( nombre ) )`
    )
    .eq("id", turnoId)
    .maybeSingle();

  if (!turno) throw new Error("No se encontró el turno.");

  const url = baseUrl();
  return {
    id: turno.id,
    numero: turno.numero,
    inicio: turno.fecha_hora_inicio,
    cliente: uno(turno.clients) as Cliente,
    servicios: (turno.appointment_services ?? [])
      .map((s) => uno(s.services)?.nombre)
      .filter((n): n is string => Boolean(n)),
    urlGestion: url ? `${url}/turnos/gestionar/${turno.token_gestion}` : null,
    urlReserva: url ? `${url}/turnos` : null,
  };
}

type Evento = {
  tipo: TipoEmail;
  turnoId: string;
  armar: (
    turno: Awaited<ReturnType<typeof cargarTurno>>,
    nombreNegocio: string
  ) => { asunto: string; html: string };
};

async function enviarEventoDeTurno(e: Evento): Promise<void> {
  await protegido(
    { tipo: e.tipo, referencia: "Turno", appointmentId: e.turnoId },
    async () => {
      const admin = createAdminClient();
      const turno = await cargarTurno(admin, e.turnoId);
      const plantilla = e.armar(turno, await nombreNegocio(admin));

      await enviarEmail({
        tipo: e.tipo,
        para: turno.cliente?.email,
        asunto: plantilla.asunto,
        html: plantilla.html,
        cliente: { nombre: nombreCompleto(turno.cliente) },
        clientId: turno.cliente?.id,
        referencia: `Turno N° ${turno.numero}`,
        appointmentId: turno.id,
      });
    }
  );
}

function datosTurno(t: Awaited<ReturnType<typeof cargarTurno>>, negocio: string) {
  return {
    nombreNegocio: negocio,
    nombreCliente: t.cliente?.nombre ?? "",
    numero: t.numero,
    inicio: t.inicio,
    servicios: t.servicios,
    urlGestion: t.urlGestion,
    urlReserva: t.urlReserva,
  };
}

export function enviarEmailTurnoCancelado(
  turnoId: string,
  p: { canceladoPor: "CLIENTE" | "STAFF"; motivo: string | null }
) {
  return enviarEventoDeTurno({
    tipo: "TURNO_CANCELADO",
    turnoId,
    armar: (t, negocio) =>
      plantillaTurnoCancelado({ ...datosTurno(t, negocio), ...p }),
  });
}

/** El staff propone un nuevo horario: el cliente tiene que responder. */
export function enviarEmailReprogramacionPropuesta(
  turnoId: string,
  p: { inicioPropuesto: string; motivo: string | null }
) {
  return enviarEventoDeTurno({
    tipo: "REPROGRAMACION_PROPUESTA",
    turnoId,
    armar: (t, negocio) =>
      plantillaReprogramacionPropuesta({
        ...datosTurno(t, negocio),
        inicioActual: t.inicio,
        ...p,
      }),
  });
}

/** El cliente pidió cambiar el horario: se le confirma que lo recibimos. */
export function enviarEmailReprogramacionSolicitada(
  turnoId: string,
  p: { inicioPropuesto: string; motivo: string | null }
) {
  return enviarEventoDeTurno({
    tipo: "REPROGRAMACION_SOLICITADA",
    turnoId,
    armar: (t, negocio) =>
      plantillaReprogramacionSolicitada({
        ...datosTurno(t, negocio),
        inicioActual: t.inicio,
        ...p,
      }),
  });
}

/** Se aceptó la reprogramación (el turno ya está en el horario nuevo). */
export function enviarEmailReprogramacionConfirmada(
  turnoId: string,
  p: { inicioAnterior: string }
) {
  return enviarEventoDeTurno({
    tipo: "REPROGRAMACION_CONFIRMADA",
    turnoId,
    armar: (t, negocio) =>
      plantillaReprogramacionConfirmada({ ...datosTurno(t, negocio), ...p }),
  });
}

/** El staff rechazó el pedido de reprogramación del cliente. */
export function enviarEmailReprogramacionRechazada(
  turnoId: string,
  p: { inicioPedido: string; motivo: string | null }
) {
  return enviarEventoDeTurno({
    tipo: "REPROGRAMACION_RECHAZADA",
    turnoId,
    armar: (t, negocio) =>
      plantillaReprogramacionRechazada({ ...datosTurno(t, negocio), ...p }),
  });
}