"use server";

import { revalidatePath } from "next/cache";
import { checkAdmin } from "@/lib/auth/guards";
import { idSchema } from "@/lib/validations/reprogramacion";
import { reenviarEmailFallido } from "@/lib/email/reenviar";
import type { ActionResult } from "@/types/models";

/** Solo administradores: vuelve a intentar enviar un mail que había fallado. */
export async function reintentarEmailFallido(logId: string): Promise<ActionResult> {
  const perfil = await checkAdmin();
  if (!perfil) return { ok: false, error: "No autorizado." };

  const id = idSchema.safeParse(logId);
  if (!id.success) return { ok: false, error: "Identificador inválido." };

  const res = await reenviarEmailFallido(id.data);

  revalidatePath("/monitorizacion");
  revalidatePath("/dashboard");
  return res;
}