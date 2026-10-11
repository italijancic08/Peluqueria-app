"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { checkAuth } from "@/lib/auth/guards";
import { idSchema } from "@/lib/validations/reprogramacion";
import type { ActionResult } from "@/types/models";

/** Marca como vista la cancelación de un cliente: deja de aparecer en el dashboard. */
export async function descartarCancelacion(turnoId: string): Promise<ActionResult> {
  const perfil = await checkAuth();
  if (!perfil) return { ok: false, error: "No autorizado." };

  const id = idSchema.safeParse(turnoId);
  if (!id.success) return { ok: false, error: "Identificador inválido." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("appointments")
    .update({ cancelacion_vista_at: new Date().toISOString() })
    .eq("id", id.data)
    .eq("estado", "CANCELADO")
    .eq("cancelado_por", "CLIENTE")
    .is("cancelacion_vista_at", null);

  if (error) return { ok: false, error: "No se pudo descartar la notificación." };

  revalidatePath("/dashboard");
  return { ok: true, data: undefined };
}