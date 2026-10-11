"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { codigoTurnoSchema, normalizarCodigo } from "@/lib/validations/codigo-turno";
import type { ActionResult } from "@/types/models";

/** Sin sesión: busca el turno por su código corto y devuelve el token de gestión. */
export async function buscarTurnoPorCodigo(
  codigo: string
): Promise<ActionResult<{ token: string }>> {
  const limpio = normalizarCodigo(typeof codigo === "string" ? codigo : "");
  const parsed = codigoTurnoSchema.safeParse(limpio);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Código inválido." };
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("appointments")
    .select("token_gestion")
    .eq("codigo", parsed.data)
    .maybeSingle();

  if (!data) {
    return { ok: false, error: "No encontramos un turno con ese código. Revisalo e intentá de nuevo." };
  }

  return { ok: true, data: { token: data.token_gestion } };
}