"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { checkAuth, checkAdmin } from "@/lib/auth/guards";
import { servicioSchema } from "@/lib/validations/service";
import type { ActionResult, Service } from "@/types/models";

type VarianteInput = {
  variante_id?: string | null;
  nombre: string;
  precio: number;
  duracion_min: number;
};

/** Con variantes, el servicio queda con el precio y la duración más bajos (se muestra "desde"). */
function datosBase(d: { precio: number; duracion_min: number; variantes: VarianteInput[] }) {
  if (d.variantes.length === 0) {
    return { precio: d.precio, duracion_min: d.duracion_min };
  }
  return {
    precio: Math.min(...d.variantes.map((v) => v.precio)),
    duracion_min: Math.min(...d.variantes.map((v) => v.duracion_min)),
  };
}

/** Crea, edita y desactiva variantes para que queden como las envió el formulario. */
async function sincronizarVariantes(
  supabase: Awaited<ReturnType<typeof createClient>>,
  serviceId: string,
  variantes: VarianteInput[]
): Promise<string | null> {
  const { data: existentes, error: errorLectura } = await supabase
    .from("service_variants")
    .select("id")
    .eq("service_id", serviceId)
    .eq("activo", true);

  if (errorLectura) return "No se pudieron leer las variantes.";

  const enviados = new Set(
    variantes.map((v) => v.variante_id).filter((id): id is string => !!id)
  );
  const aDesactivar = (existentes ?? []).map((v) => v.id).filter((id) => !enviados.has(id));

  // Las quitadas se desactivan (no se borran: los turnos y trabajos viejos las usan).
  if (aDesactivar.length > 0) {
    const { error } = await supabase
      .from("service_variants")
      .update({ activo: false })
      .in("id", aDesactivar);
    if (error) return "No se pudieron quitar las variantes.";
  }

  for (const v of variantes) {
    const datos = { nombre: v.nombre, precio: v.precio, duracion_min: v.duracion_min };

    const { error } = v.variante_id
      ? await supabase
          .from("service_variants")
          .update(datos)
          .eq("id", v.variante_id)
          .eq("service_id", serviceId)
      : await supabase.from("service_variants").insert({ ...datos, service_id: serviceId });

    if (error) {
      return error.code === "23505"
        ? "Hay dos variantes con el mismo nombre."
        : "No se pudieron guardar las variantes.";
    }
  }

  return null;
}

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

  const base = datosBase(parsed.data);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .insert({
      nombre: parsed.data.nombre,
      descripcion: parsed.data.descripcion || null,
      precio: base.precio,
      duracion_min: base.duracion_min,
      cupo_maximo: parsed.data.cupo_maximo ?? null,
      tiene_ficha_tecnica: parsed.data.tiene_ficha_tecnica,
    })
    .select()
    .single();

  if (error || !data) return { ok: false, error: "No se pudo crear el servicio." };

  const errorVariantes = await sincronizarVariantes(supabase, data.id, parsed.data.variantes);
  if (errorVariantes) {
    revalidatePath("/servicios");
    return {
      ok: false,
      error: `El servicio se creó, pero ${errorVariantes} Editalo para volver a cargar las variantes.`,
    };
  }

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

  const base = datosBase(parsed.data);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .update({
      nombre: parsed.data.nombre,
      descripcion: parsed.data.descripcion || null,
      precio: base.precio,
      duracion_min: base.duracion_min,
      cupo_maximo: parsed.data.cupo_maximo ?? null,
      tiene_ficha_tecnica: parsed.data.tiene_ficha_tecnica,
    })
    .eq("id", id)
    .select()
    .single();

  if (error || !data) return { ok: false, error: "No se pudo actualizar el servicio." };

  const errorVariantes = await sincronizarVariantes(supabase, id, parsed.data.variantes);
  if (errorVariantes) return { ok: false, error: errorVariantes };

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


export async function eliminarServicio(id: string): Promise<ActionResult> {
  const perfil = await checkAdmin();
  if (!perfil) return { ok: false, error: "Solo un administrador puede eliminar servicios." };

  const supabase = await createClient();
  const { error } = await supabase.from("services").delete().eq("id", id);

  if (error) {
    // 23503 = foreign key: el servicio ya se usó en turnos, trabajos o presupuestos.
    if (error.code === "23503") {
      return {
        ok: false,
        error:
          "No se puede eliminar: este servicio ya se usó en turnos, trabajos o presupuestos. Desactivalo para que deje de ofrecerse.",
      };
    }
    return { ok: false, error: "No se pudo eliminar el servicio." };
  }

  revalidatePath("/servicios");
  return { ok: true, data: undefined };
}