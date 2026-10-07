import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Cliente con service_role: SALTEA RLS POR COMPLETO.
 *
 * Usos permitidos, y ninguno más:
 *  - Alta de empleados desde el panel de administración.
 *  - Reserva pública (crear cliente y turno sin sesión).
 *  - Gestión del turno por parte del cliente (cancelar / reprogramar), siempre
 *    validando el token secreto del turno.
 *
 * Toda operación hecha con este cliente debe validar permisos a mano,
 * porque la base ya no los va a validar.
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}