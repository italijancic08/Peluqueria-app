"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { checkAuth, checkAdmin } from "@/lib/auth/guards";
import { productoSchema, movimientoStockSchema } from "@/lib/validations/product";
import type { ActionResult, Product } from "@/types/models";

export async function crearProducto(valores: unknown): Promise<ActionResult<Product>> {
  const perfil = await checkAdmin();
  if (!perfil) return { ok: false, error: "Solo un administrador puede crear productos." };

  const parsed = productoSchema.safeParse(valores);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisá los datos del formulario.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .insert({
      nombre: parsed.data.nombre,
      categoria: parsed.data.categoria || null,
      unidad: parsed.data.unidad,
      stock_minimo: parsed.data.stock_minimo,
      costo: parsed.data.costo ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: "No se pudo crear el producto." };

  revalidatePath("/stock");
  return { ok: true, data };
}

export async function actualizarProducto(
  id: string,
  valores: unknown
): Promise<ActionResult<Product>> {
  const perfil = await checkAdmin();
  if (!perfil) return { ok: false, error: "Solo un administrador puede editar productos." };

  const parsed = productoSchema.safeParse(valores);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisá los datos del formulario.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .update({
      nombre: parsed.data.nombre,
      categoria: parsed.data.categoria || null,
      unidad: parsed.data.unidad,
      stock_minimo: parsed.data.stock_minimo,
      costo: parsed.data.costo ?? null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: "No se pudo actualizar el producto." };

  revalidatePath("/stock");
  return { ok: true, data };
}

export async function alternarProductoActivo(id: string, activo: boolean): Promise<ActionResult> {
  const perfil = await checkAdmin();
  if (!perfil) return { ok: false, error: "No autorizado." };

  const supabase = await createClient();
  const { error } = await supabase.from("products").update({ activo }).eq("id", id);

  if (error) return { ok: false, error: "No se pudo actualizar el estado." };

  revalidatePath("/stock");
  return { ok: true, data: undefined };
}

export async function registrarMovimientoStock(valores: unknown): Promise<ActionResult> {
  const perfil = await checkAuth();
  if (!perfil) return { ok: false, error: "No autorizado." };

  const parsed = movimientoStockSchema.safeParse(valores);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisá los datos del formulario.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  if (parsed.data.cantidad === 0) {
    return { ok: false, error: "La cantidad no puede ser cero." };
  }

  // ENTRADA siempre suma stock; si cargaron un número negativo por error, se corrige el signo.
  const cantidadFinal =
    parsed.data.tipo === "ENTRADA" ? Math.abs(parsed.data.cantidad) : parsed.data.cantidad;

  const supabase = await createClient();
  const { error } = await supabase.from("stock_movements").insert({
    product_id: parsed.data.productId,
    tipo: parsed.data.tipo,
    cantidad: cantidadFinal,
    motivo: parsed.data.motivo || null,
    created_by: perfil.id,
  });

  if (error) return { ok: false, error: "No se pudo registrar el movimiento." };

  revalidatePath("/stock");
  revalidatePath("/stock/movimientos");
  return { ok: true, data: undefined };
}