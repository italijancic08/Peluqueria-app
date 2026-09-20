"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { checkAdmin } from "@/lib/auth/guards";
import { businessSettingsSchema, businessHoursSchema } from "@/lib/validations/settings";
import type { ActionResult } from "@/types/models";

export async function actualizarConfiguracion(valores: unknown): Promise<ActionResult> {
  const perfil = await checkAdmin();
  if (!perfil) return { ok: false, error: "Solo un administrador puede editar la configuración." };

  const parsed = businessSettingsSchema.safeParse(valores);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisá los datos del formulario.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("business_settings")
    .update({
      nombre_negocio: parsed.data.nombre_negocio,
      comision_default_pct: parsed.data.comision_default_pct,
      capacidad_simultanea: parsed.data.capacidad_simultanea,
      intervalo_turnos_min: parsed.data.intervalo_turnos_min,
    })
    .eq("id", 1);

  if (error) return { ok: false, error: "No se pudo guardar la configuración." };

  revalidatePath("/configuracion");
  return { ok: true, data: undefined };
}

export async function actualizarHorarios(valores: unknown): Promise<ActionResult> {
  const perfil = await checkAdmin();
  if (!perfil) return { ok: false, error: "Solo un administrador puede editar los horarios." };

  const parsed = businessHoursSchema.safeParse(valores);
  if (!parsed.success) {
    return { ok: false, error: "Revisá los horarios cargados." };
  }

  for (const h of parsed.data.horarios) {
    if (h.activo && h.hora_cierre <= h.hora_apertura) {
      return {
        ok: false,
        error: "El horario de cierre tiene que ser posterior al de apertura en todos los días activos.",
      };
    }
  }

  const supabase = await createClient();

  for (const h of parsed.data.horarios) {
    const { error } = await supabase
      .from("business_hours")
      .update({
        activo: h.activo,
        hora_apertura: h.hora_apertura,
        hora_cierre: h.hora_cierre,
      })
      .eq("id", h.id);

    if (error) return { ok: false, error: "No se pudieron guardar los horarios." };
  }

  revalidatePath("/configuracion/horarios");
  return { ok: true, data: undefined };
}