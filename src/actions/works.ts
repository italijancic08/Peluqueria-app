"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { checkAuth } from "@/lib/auth/guards";
import { consumoSchema, pagoSchema } from "@/lib/validations/work";
import type { ActionResult } from "@/types/models";

export async function tomarTrabajo(id: string): Promise<ActionResult> {
  const perfil = await checkAuth();
  if (!perfil) return { ok: false, error: "No autorizado." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("works")
    .update({ profile_id: perfil.id, estado: "TOMADO", fecha_inicio: new Date().toISOString() })
    .eq("id", id)
    .eq("estado", "DISPONIBLE")
    .select("id")
    .maybeSingle();

  if (error) return { ok: false, error: "No se pudo tomar el trabajo." };
  if (!data) return { ok: false, error: "Alguien más ya tomó este trabajo." };

  revalidatePath("/trabajos");
  revalidatePath("/trabajos/disponibles");
  return { ok: true, data: undefined };
}

export async function finalizarTrabajo(id: string, consumos: unknown): Promise<ActionResult> {
  const perfil = await checkAuth();
  if (!perfil) return { ok: false, error: "No autorizado." };

  const parsed = consumoSchema.safeParse(consumos);
  if (!parsed.success) {
    return { ok: false, error: "Revisá los productos cargados." };
  }

  const supabase = await createClient();

  const { data: trabajo } = await supabase
    .from("works")
    .select("id, estado, profile_id")
    .eq("id", id)
    .single();

  if (!trabajo) return { ok: false, error: "Trabajo no encontrado." };
  if (trabajo.estado !== "TOMADO" && trabajo.estado !== "EN_CURSO") {
    return { ok: false, error: "Este trabajo no se puede finalizar en su estado actual." };
  }
  if (trabajo.profile_id !== perfil.id && perfil.rol !== "ADMIN") {
    return { ok: false, error: "Solo el empleado asignado puede finalizar este trabajo." };
  }

  for (const item of parsed.data.items) {
    const { error: errorProducto } = await supabase.from("work_products").insert({
      work_id: id,
      product_id: item.productId,
      cantidad: item.cantidad,
    });
    if (errorProducto) {
      return { ok: false, error: "No se pudo registrar el consumo de productos." };
    }

    const { error: errorMovimiento } = await supabase.from("stock_movements").insert({
      product_id: item.productId,
      tipo: "CONSUMO",
      cantidad: -Math.abs(item.cantidad),
      work_id: id,
      created_by: perfil.id,
    });
    if (errorMovimiento) {
      return { ok: false, error: "No se pudo descontar el stock." };
    }
  }

  const { error: errorFinalizar } = await supabase
    .from("works")
    .update({ estado: "FINALIZADO", fecha_fin: new Date().toISOString() })
    .eq("id", id);

  if (errorFinalizar) return { ok: false, error: "No se pudo finalizar el trabajo." };

  revalidatePath("/trabajos");
  revalidatePath(`/trabajos/${id}`);
  return { ok: true, data: undefined };
}

export async function cobrarTrabajo(
  id: string,
  pagos: unknown
): Promise<ActionResult<{ cobrado: boolean; totalPagado: number }>> {
  const perfil = await checkAuth();
  if (!perfil) return { ok: false, error: "No autorizado." };

  const parsed = pagoSchema.safeParse(pagos);
  if (!parsed.success) {
    return { ok: false, error: "Revisá los pagos cargados." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("cobrar_trabajo", {
    p_work_id: id,
    p_pagos: parsed.data.items.map((p) => ({
      metodo: p.metodo,
      monto: p.monto,
      cuotas: p.cuotas ?? null,
    })),
  });

  if (error) return { ok: false, error: error.message || "No se pudo registrar el cobro." };

  const resultado = Array.isArray(data) ? data[0] : data;

  revalidatePath("/trabajos");
  revalidatePath(`/trabajos/${id}`);
  return {
    ok: true,
    data: { cobrado: resultado?.cobrado ?? false, totalPagado: Number(resultado?.total_pagado ?? 0) },
  };
}