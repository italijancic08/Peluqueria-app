"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { checkAdmin } from "@/lib/auth/guards";
import { comisionManualSchema } from "@/lib/validations/commission";
import type { ActionResult } from "@/types/models";

export async function liquidarSemana(
  profileId: string,
  semanaInicio: string,
  semanaFin: string
): Promise<ActionResult<{ settlementId: string }>> {
  const perfil = await checkAdmin();
  if (!perfil) return { ok: false, error: "Solo un administrador puede liquidar comisiones." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("liquidar_semana", {
    p_profile_id: profileId,
    p_semana_inicio: semanaInicio,
    p_semana_fin: semanaFin,
  });

  if (error) return { ok: false, error: error.message || "No se pudo liquidar la semana." };

  revalidatePath("/liquidaciones");
  return { ok: true, data: { settlementId: data as string } };
}

export async function marcarLiquidacionPagada(settlementId: string): Promise<ActionResult> {
  const perfil = await checkAdmin();
  if (!perfil) return { ok: false, error: "Solo un administrador puede marcar pagos." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("marcar_liquidacion_pagada", {
    p_settlement_id: settlementId,
  });

  if (error) return { ok: false, error: "No se pudo marcar como pagada." };

  revalidatePath("/liquidaciones");
  return { ok: true, data: undefined };
}

export async function crearComisionManual(valores: unknown): Promise<ActionResult> {
  const perfil = await checkAdmin();
  if (!perfil) return { ok: false, error: "Solo un administrador puede cargar comisiones manuales." };

  const parsed = comisionManualSchema.safeParse(valores);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisá los datos del formulario.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("crear_comision_manual", {
    p_profile_id: parsed.data.profile_id,
    p_base_monto: parsed.data.base_monto,
    p_descripcion: parsed.data.descripcion || undefined,
  });

  if (error) return { ok: false, error: error.message || "No se pudo cargar la comisión." };

  revalidatePath("/liquidaciones");
  revalidatePath("/dashboard");
  revalidatePath("/estadisticas");
  return { ok: true, data: undefined };
}