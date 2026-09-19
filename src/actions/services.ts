"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { checkAuth, checkAdmin } from "@/lib/auth/guards";
import { servicioSchema } from "@/lib/validations/service";
import type { ActionResult, Service } from "@/types/models";

export async function crearServicio(valores: unknown): Promise<ActionResult<Service>> {
  const perfil = await checkAdmin();
  if (!perfil) return { ok: false, error: "Solo un administrador puede crear servicios." };

  const parsed = servicioSchema.safeParse(valores);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisá los datos del formulario.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .insert({
      nombre: parsed.data.nombre,
      descripcion: parsed.data.descripcion || null,
      precio: parsed.data.precio,
      duracion_min: parsed.data.duracion_min,
      cupo_maximo: parsed.data.cupo_maximo || null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: "No se pudo crear el servicio." };

  revalidatePath("/servicios");
  return { ok: true, data };
}

export async function actualizarServicio(
  id: string,
  valores: unknown
): Promise<ActionResult<Service>> {
  const perfil = await checkAdmin();
  if (!perfil) return { ok: false, error: "Solo un administrador puede editar servicios." };

  const parsed = servicioSchema.safeParse(valores);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisá los datos del formulario.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .update({
      nombre: parsed.data.nombre,
      descripcion: parsed.data.descripcion || null,
      precio: parsed.data.precio,
      duracion_min: parsed.data.duracion_min,
      cupo_maximo: parsed.data.cupo_maximo || null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: "No se pudo actualizar el servicio." };

  revalidatePath("/servicios");
  return { ok: true, data };
}

export async function alternarServicioActivo(
  id: string,
  activo: boolean
): Promise<ActionResult> {
  const perfil = await checkAdmin();
  if (!perfil) return { ok: false, error: "No autorizado." };

  const supabase = await createClient();
  const { error } = await supabase.from("services").update({ activo }).eq("id", id);

  if (error) return { ok: false, error: "No se pudo actualizar el estado." };

  revalidatePath("/servicios");
  return { ok: true, data: undefined };
}