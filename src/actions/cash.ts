"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { checkAuth } from "@/lib/auth/guards";
import { movimientoManualSchema } from "@/lib/validations/cash";
import type { ActionResult } from "@/types/models";

export async function crearMovimientoManual(valores: unknown): Promise<ActionResult> {
  const perfil = await checkAuth();
  if (!perfil) return { ok: false, error: "No autorizado." };

  const parsed = movimientoManualSchema.safeParse(valores);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisá los datos del formulario.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("cash_movements").insert({
    tipo: parsed.data.tipo,
    metodo: parsed.data.metodo,
    monto: parsed.data.monto,
    descripcion: parsed.data.descripcion,
    created_by: perfil.id,
  });

  if (error) return { ok: false, error: "No se pudo registrar el movimiento." };

  revalidatePath("/caja");
  return { ok: true, data: undefined };
}

export async function actualizarMovimientoManual(
  id: string,
  valores: unknown
): Promise<ActionResult> {
  const perfil = await checkAuth();
  if (!perfil) return { ok: false, error: "No autorizado." };

  const parsed = movimientoManualSchema.safeParse(valores);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisá los datos del formulario.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();

  const { data: movimiento } = await supabase
    .from("cash_movements")
    .select("work_id")
    .eq("id", id)
    .single();

  if (!movimiento) return { ok: false, error: "Movimiento no encontrado." };
  if (movimiento.work_id) {
    return { ok: false, error: "Este movimiento viene de un cobro y no se puede editar acá." };
  }

  const { error } = await supabase
    .from("cash_movements")
    .update({
      tipo: parsed.data.tipo,
      metodo: parsed.data.metodo,
      monto: parsed.data.monto,
      descripcion: parsed.data.descripcion,
    })
    .eq("id", id);

  if (error) return { ok: false, error: "No se pudo actualizar el movimiento." };

  revalidatePath("/caja");
  return { ok: true, data: undefined };
}