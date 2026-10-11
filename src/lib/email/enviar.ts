import "server-only";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { EMAIL_NEGOCIO } from "@/constants/negocio";
import type { EstadoEmail, TipoEmail } from "./tipos";

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Ids = {
  clientId?: string | null;
  appointmentId?: string | null;
  workId?: string | null;
  budgetId?: string | null;
};

type DatosLog = Ids & {
  tipo: TipoEmail;
  estado: EstadoEmail;
  motivo?: string | null;
  clienteNombre?: string | null;
  emailDestino?: string | null;
  asunto?: string | null;
  referencia?: string | null;
  resendId?: string | null;
};

/** Guarda el intento en `email_logs`. Nunca lanza error. */
export async function registrarEmailLog(d: DatosLog): Promise<void> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("email_logs").insert({
      tipo: d.tipo,
      estado: d.estado,
      motivo: d.motivo ?? null,
      client_id: d.clientId ?? null,
      cliente_nombre: d.clienteNombre ?? null,
      email_destino: d.emailDestino ?? null,
      asunto: d.asunto ?? null,
      referencia: d.referencia ?? null,
      appointment_id: d.appointmentId ?? null,
      work_id: d.workId ?? null,
      budget_id: d.budgetId ?? null,
      resend_id: d.resendId ?? null,
    });
    if (error) console.error("[email] No se pudo guardar el log:", error.message);
  } catch (e) {
    console.error("[email] No se pudo guardar el log:", e);
  }
}

export type EnvioEmail = Ids & {
  tipo: TipoEmail;
  /** Email del cliente tal como está cargado (puede ser null o inválido). */
  para: string | null | undefined;
  asunto: string;
  html: string;
  adjuntos?: { filename: string; content: Buffer }[];
  cliente: { nombre: string };
  /** Texto corto para identificar el envío en la monitorización. */
  referencia: string;
  /** Aviso que se guarda como motivo aunque el envío salga bien (ej: sin adjunto). */
  aviso?: string | null;
};

/**
 * Envía un mail con Resend y deja constancia del resultado.
 * Nunca lanza error: si algo falla, queda registrado como FALLIDO con su motivo
 * para que la operación principal (cobrar, cancelar, etc.) no se vea afectada.
 */
export async function enviarEmail(p: EnvioEmail): Promise<void> {
  const base: DatosLog = {
    tipo: p.tipo,
    estado: "FALLIDO",
    clienteNombre: p.cliente.nombre,
    emailDestino: p.para?.trim() || null,
    asunto: p.asunto,
    referencia: p.referencia,
    clientId: p.clientId,
    appointmentId: p.appointmentId,
    workId: p.workId,
    budgetId: p.budgetId,
  };

  const destino = p.para?.trim();

  if (!destino) {
    return registrarEmailLog({ ...base, motivo: "El cliente no tiene un email cargado." });
  }
  if (!EMAIL_VALIDO.test(destino)) {
    return registrarEmailLog({
      ...base,
      motivo: `El email cargado no es válido: "${destino}".`,
    });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return registrarEmailLog({
      ...base,
      motivo: "Falta configurar RESEND_API_KEY en el servidor.",
    });
  }

  const remitente = process.env.EMAIL_FROM?.trim();
  if (!remitente) {
    return registrarEmailLog({
      ...base,
      motivo: "Falta configurar EMAIL_FROM en el servidor.",
    });
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: remitente,
      to: [destino],
      replyTo: EMAIL_NEGOCIO,
      subject: p.asunto,
      html: p.html,
      attachments: p.adjuntos,
    });

    if (error) {
      return registrarEmailLog({
        ...base,
        motivo: `Resend rechazó el envío: ${error.message}`,
      });
    }

    return registrarEmailLog({
      ...base,
      estado: "ENVIADO",
      motivo: p.aviso ?? null,
      resendId: data?.id ?? null,
    });
  } catch (e) {
    const detalle = e instanceof Error ? e.message : String(e);
    return registrarEmailLog({
      ...base,
      motivo: `Error inesperado al enviar: ${detalle}`,
    });
  }
}