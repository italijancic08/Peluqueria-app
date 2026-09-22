"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { checkAuth, checkAdmin } from "@/lib/auth/guards";
import type { ActionResult } from "@/types/models";

export async function subirFotoPerfil(
  profileId: string,
  formData: FormData
): Promise<ActionResult<{ url: string }>> {
  const perfil = await checkAuth();
  if (!perfil) return { ok: false, error: "No autorizado." };

  if (perfil.id !== profileId && perfil.rol !== "ADMIN") {
    return { ok: false, error: "No podés cambiar la foto de otro empleado." };
  }

  const file = formData.get("foto") as File | null;
  if (!file || file.size === 0) return { ok: false, error: "Elegí una imagen." };
  if (!file.type.startsWith("image/")) return { ok: false, error: "El archivo tiene que ser una imagen." };
  if (file.size > 3 * 1024 * 1024) return { ok: false, error: "La imagen no puede pesar más de 3 MB." };

  const supabase = await createClient();
  const extension = file.name.split(".").pop() || "jpg";
  const ruta = `${profileId}/${Date.now()}.${extension}`;

  const { error: errorSubida } = await supabase.storage.from("avatars").upload(ruta, file, {
    upsert: true,
    contentType: file.type,
  });

  if (errorSubida) return { ok: false, error: "No se pudo subir la imagen." };

  const { data: urlPublica } = supabase.storage.from("avatars").getPublicUrl(ruta);

  const { error: errorUpdate } = await supabase
    .from("profiles")
    .update({ foto_url: urlPublica.publicUrl })
    .eq("id", profileId);

  if (errorUpdate) return { ok: false, error: "No se pudo guardar la foto." };

  revalidatePath("/perfil");
  revalidatePath("/empleados");
  revalidatePath("/turnos");
  return { ok: true, data: { url: urlPublica.publicUrl } };
}

export async function actualizarVisibilidadPublica(id: string, visible: boolean): Promise<ActionResult> {
  const perfil = await checkAdmin();
  if (!perfil) return { ok: false, error: "Solo un administrador puede cambiar esto." };

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ visible_publico: visible }).eq("id", id);

  if (error) return { ok: false, error: "No se pudo actualizar." };

  revalidatePath("/empleados");
  revalidatePath("/turnos");
  return { ok: true, data: undefined };
}