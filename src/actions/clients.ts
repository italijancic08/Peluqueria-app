"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { checkAuth, checkAdmin } from "@/lib/auth/guards";
import { clienteSchema } from "@/lib/validations/client";
import type { ActionResult, Client } from "@/types/models";

export async function crearCliente(valores: unknown): Promise<ActionResult<Client>> {
  const perfil = await checkAuth();
  if (!perfil) return { ok: false, error: "No autorizado." };

  const parsed = clienteSchema.safeParse(valores);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisá los datos del formulario.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .insert({
      nombre: parsed.data.nombre,
      apellido: parsed.data.apellido,
      telefono: parsed.data.telefono,
      dni: parsed.data.dni || null,
      email: parsed.data.email || null,
      notas: parsed.data.notas || null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "Ya existe un cliente con ese teléfono." };
    }
    return { ok: false, error: "No se pudo crear el cliente." };
  }

  revalidatePath("/clientes");
  return { ok: true, data };
}

export async function actualizarCliente(
  id: string,
  valores: unknown
): Promise<ActionResult<Client>> {
  const perfil = await checkAuth();
  if (!perfil) return { ok: false, error: "No autorizado." };

  const parsed = clienteSchema.safeParse(valores);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisá los datos del formulario.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .update({
      nombre: parsed.data.nombre,
      apellido: parsed.data.apellido,
      telefono: parsed.data.telefono,
      dni: parsed.data.dni || null,
      email: parsed.data.email || null,
      notas: parsed.data.notas || null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "Ya existe otro cliente con ese teléfono." };
    }
    return { ok: false, error: "No se pudo actualizar el cliente." };
  }

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
  return { ok: true, data };
}

export async function eliminarCliente(id: string): Promise<ActionResult> {
  const perfil = await checkAdmin();
  if (!perfil) {
    return { ok: false, error: "Solo un administrador puede eliminar clientes." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .update({ activo: false })
    .eq("id", id);

  if (error) return { ok: false, error: "No se pudo eliminar el cliente." };

  revalidatePath("/clientes");
  return { ok: true, data: undefined };
}