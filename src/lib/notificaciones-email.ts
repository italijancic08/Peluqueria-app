import type { createClient } from "@/lib/supabase/server";
import { ETIQUETA_TIPO_EMAIL, type TipoEmail } from "@/lib/email/tipos";
import type { EmailFallidoItem } from "@/components/dashboard/alerta-email-fallido";

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

/** Máximo de avisos de mails fallidos que se muestran a la vez en el dashboard. */
const MAX_AVISOS = 5;

/** Los fallos más viejos que esto no se muestran como aviso (siguen en Monitorización). */
const DIAS_VIGENCIA = 14;

/** Mails que no se pudieron enviar y que nadie del personal vio todavía. */
export async function cargarEmailsFallidos(
  supabase: SupabaseServer
): Promise<EmailFallidoItem[]> {
  const desde = new Date(Date.now() - DIAS_VIGENCIA * 24 * 3600000).toISOString();

  const { data } = await supabase
    .from("email_logs")
    .select("id, tipo, motivo, referencia, cliente_nombre, client_id")
    .eq("estado", "FALLIDO")
    .is("visto_at", null)
    .gte("created_at", desde)
    .order("created_at", { ascending: false })
    .limit(MAX_AVISOS);

  return (data ?? []).map((m) => ({
    id: m.id,
    tipoTexto: ETIQUETA_TIPO_EMAIL[m.tipo as TipoEmail] ?? "Mail",
    referencia: m.referencia,
    cliente: m.cliente_nombre?.trim() || "Un cliente",
    clientId: m.client_id,
    motivo: m.motivo,
  }));
}