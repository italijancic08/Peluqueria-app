import type { createClient } from "@/lib/supabase/server";

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

/**
 * Cuenta los turnos que siguen sin empleado asignado y que están por
 * empezar (o ya empezaron hace poco) dentro del margen de aviso configurado.
 */
export async function contarTurnosSinTomar(
  supabase: SupabaseServer
): Promise<{ cantidad: number; avisoMin: number }> {
  const { data: settings } = await supabase
    .from("business_settings")
    .select("aviso_sin_tomar_min")
    .eq("id", 1)
    .single();

  const avisoMin = settings?.aviso_sin_tomar_min ?? 60;
  const ahora = Date.now();
  const limite = new Date(ahora + avisoMin * 60000).toISOString();
  const desde = new Date(ahora - 12 * 3600000).toISOString(); // ignora turnos viejos sin resolver

  const { count } = await supabase
    .from("works")
    .select("id, appointments!inner(estado, fecha_hora_inicio)", { count: "exact", head: true })
    .eq("estado", "DISPONIBLE")
    .eq("appointments.estado", "CONFIRMADO")
    .gte("appointments.fecha_hora_inicio", desde)
    .lte("appointments.fecha_hora_inicio", limite);

  return { cantidad: count ?? 0, avisoMin };
}