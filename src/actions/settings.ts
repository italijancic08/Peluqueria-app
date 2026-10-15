"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { checkAdmin } from "@/lib/auth/guards";
import { businessSettingsSchema, businessHoursSchema } from "@/lib/validations/settings";
import { DIAS_SEMANA } from "@/constants/labels";
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
      recargo_tarjeta_pct: parsed.data.recargo_tarjeta_pct,
      recargo_debito_pct: parsed.data.recargo_debito_pct,
      capacidad_simultanea: parsed.data.capacidad_simultanea,
      intervalo_turnos_min: parsed.data.intervalo_turnos_min,
      turnos_expiran: parsed.data.turnos_expiran,
      expiracion_turno_min: parsed.data.expiracion_turno_min,
      aviso_sin_tomar_min: parsed.data.aviso_sin_tomar_min,
      hora_limite_trabajo: parsed.data.hora_limite_trabajo,
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
    const dia = DIAS_SEMANA[h.dia_semana];

    const hayManana = h.hora_apertura !== null || h.hora_cierre !== null;
    const hayTarde = h.hora_apertura_2 !== null || h.hora_cierre_2 !== null;

    // Cada turno es opcional: o se cargan los dos horarios o ninguno
    if (hayManana && (h.hora_apertura === null || h.hora_cierre === null)) {
      return {
        ok: false,
        error: `${dia}: completá apertura y cierre de la mañana, o desactivá el turno.`,
      };
    }
    if (hayTarde && (h.hora_apertura_2 === null || h.hora_cierre_2 === null)) {
      return {
        ok: false,
        error: `${dia}: completá apertura y cierre de la tarde, o desactivá el turno.`,
      };
    }

    // Un día abierto necesita al menos un turno
    if (h.activo && !hayManana && !hayTarde) {
      return {
        ok: false,
        error: `${dia}: activá la mañana, la tarde o ambas, o desmarcá el día.`,
      };
    }

    if (h.hora_apertura !== null && h.hora_cierre !== null && h.hora_cierre <= h.hora_apertura) {
      return { ok: false, error: `${dia}: la mañana tiene que cerrar después de abrir.` };
    }
    if (
      h.hora_apertura_2 !== null &&
      h.hora_cierre_2 !== null &&
      h.hora_cierre_2 <= h.hora_apertura_2
    ) {
      return { ok: false, error: `${dia}: la tarde tiene que cerrar después de abrir.` };
    }
    if (h.hora_cierre !== null && h.hora_apertura_2 !== null && h.hora_apertura_2 <= h.hora_cierre) {
      return {
        ok: false,
        error: `${dia}: la tarde tiene que abrir después del cierre de la mañana.`,
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
        hora_apertura_2: h.hora_apertura_2,
        hora_cierre_2: h.hora_cierre_2,
      })
      .eq("id", h.id);

    if (error) return { ok: false, error: "No se pudieron guardar los horarios." };
  }

  revalidatePath("/configuracion/horarios");
  return { ok: true, data: undefined };
}