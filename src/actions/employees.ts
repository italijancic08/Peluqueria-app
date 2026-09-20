"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkAdmin } from "@/lib/auth/guards";
import { empleadoSchema, editarEmpleadoSchema } from "@/lib/validations/employee";
import type { ActionResult, Profile } from "@/types/models";

export async function crearEmpleado(valores: unknown): Promise<ActionResult<Profile>> {
  const perfil = await checkAdmin();
  if (!perfil) return { ok: false, error: "Solo un administrador puede crear empleados." };

  const parsed = empleadoSchema.safeParse(valores);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisá los datos del formulario.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { nombre, apellido, email, telefono, rol, comision_pct, password } = parsed.data;
  const admin = createAdminClient();

  const { data: nuevoUsuario, error: errorAuth } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (errorAuth || !nuevoUsuario.user) {
    if (errorAuth?.message?.toLowerCase().includes("already")) {
      return { ok: false, error: "Ya existe un usuario con ese email." };
    }
    return { ok: false, error: "No se pudo crear el usuario." };
  }

  const { data: profile, error: errorProfile } = await admin
    .from("profiles")
    .insert({
      id: nuevoUsuario.user.id,
      nombre,
      apellido,
      email,
      telefono: telefono || null,
      rol,
      comision_pct,
    })
    .select()
    .single();

  if (errorProfile || !profile) {
    // Si falla la creación del perfil, no dejamos un usuario de auth huérfano.
    await admin.auth.admin.deleteUser(nuevoUsuario.user.id);
    return { ok: false, error: "No se pudo crear el perfil del empleado." };
  }

  revalidatePath("/empleados");
  return { ok: true, data: profile };
}

export async function actualizarEmpleado(
  id: string,
  valores: unknown
): Promise<ActionResult<Profile>> {
  const perfil = await checkAdmin();
  if (!perfil) return { ok: false, error: "Solo un administrador puede editar empleados." };

  const parsed = editarEmpleadoSchema.safeParse(valores);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisá los datos del formulario.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({
      nombre: parsed.data.nombre,
      apellido: parsed.data.apellido,
      telefono: parsed.data.telefono || null,
      rol: parsed.data.rol,
      comision_pct: parsed.data.comision_pct,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: "No se pudo actualizar el empleado." };

  revalidatePath("/empleados");
  return { ok: true, data };
}

export async function alternarEmpleadoActivo(id: string, activo: boolean): Promise<ActionResult> {
  const perfil = await checkAdmin();
  if (!perfil) return { ok: false, error: "No autorizado." };

  if (id === perfil.id && !activo) {
    return { ok: false, error: "No podés desactivarte a vos mismo." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ activo }).eq("id", id);

  if (error) return { ok: false, error: "No se pudo actualizar el estado." };

  revalidatePath("/empleados");
  return { ok: true, data: undefined };
}