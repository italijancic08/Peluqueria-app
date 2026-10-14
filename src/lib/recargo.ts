import { createClient } from "@/lib/supabase/server";

/** Recargo de tarjeta (%) configurado en el negocio. Si falla la lectura, usa 40. */
export async function obtenerRecargoTarjeta(): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("business_settings")
    .select("recargo_tarjeta_pct")
    .eq("id", 1)
    .single();

  return Number(data?.recargo_tarjeta_pct ?? 40);
}