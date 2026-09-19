"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { checkAuth } from "@/lib/auth/guards";
import { presupuestoSchema } from "@/lib/validations/budget";
import type { ActionResult, BudgetStatus } from "@/types/models";

export async function crearPresupuesto(
  valores: unknown
): Promise<ActionResult<{ id: string; numero: number }>> {
  const perfil = await checkAuth();
  if (!perfil) return { ok: false, error: "No autorizado." };

  const parsed = presupuestoSchema.safeParse(valores);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisá los datos del formulario.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { clientId, servicioIds, notas } = parsed.data;
  const supabase = await createClient();

  const { data: servicios, error: errorServicios } = await supabase
    .from("services")
    .select("id, precio")
    .in("id", servicioIds);

  if (errorServicios || !servicios || servicios.length !== servicioIds.length) {
    return { ok: false, error: "Alguno de los servicios elegidos no existe." };
  }

  const total = servicios.reduce((acc, s) => acc + Number(s.precio), 0);

  const { data: presupuesto, error: errorPresupuesto } = await supabase
    .from("budgets")
    .insert({ client_id: clientId, notas: notas || null, total, created_by: perfil.id })
    .select("id, numero")
    .single();

  if (errorPresupuesto || !presupuesto) {
    return { ok: false, error: "No se pudo crear el presupuesto." };
  }

  const { error: errorItems } = await supabase.from("budget_items").insert(
    servicios.map((s) => ({
      budget_id: presupuesto.id,
      service_id: s.id,
      precio_snapshot: s.precio,
    }))
  );

  if (errorItems) {
    return { ok: false, error: "El presupuesto se creó pero hubo un problema con los ítems." };
  }

  revalidatePath("/presupuestos");
  return { ok: true, data: presupuesto };
}

export async function actualizarEstadoPresupuesto(
  id: string,
  estado: Extract<BudgetStatus, "ACEPTADO" | "RECHAZADO">
): Promise<ActionResult> {
  const perfil = await checkAuth();
  if (!perfil) return { ok: false, error: "No autorizado." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("budgets")
    .update({ estado })
    .eq("id", id)
    .eq("estado", "PENDIENTE");

  if (error) return { ok: false, error: "No se pudo actualizar el presupuesto." };

  revalidatePath("/presupuestos");
  revalidatePath(`/presupuestos/${id}`);
  return { ok: true, data: undefined };
}

/** Trae los datos de un presupuesto aceptado para precargar el turno. */
export async function obtenerPresupuestoParaTurno(
  id: string
): Promise<ActionResult<{ clientId: string; clientLabel: string; servicioIds: string[] }>> {
  const perfil = await checkAuth();
  if (!perfil) return { ok: false, error: "No autorizado." };

  const supabase = await createClient();
  const { data: presupuesto } = await supabase
    .from("budgets")
    .select("id, client_id, estado, clients(nombre, apellido)")
    .eq("id", id)
    .single();

  if (!presupuesto) return { ok: false, error: "Presupuesto no encontrado." };
  if (presupuesto.estado !== "ACEPTADO") {
    return { ok: false, error: "Este presupuesto todavía no fue aceptado." };
  }

  const { data: items } = await supabase
    .from("budget_items")
    .select("service_id")
    .eq("budget_id", id);

  return {
    ok: true,
    data: {
      clientId: presupuesto.client_id,
      clientLabel: `${presupuesto.clients?.apellido}, ${presupuesto.clients?.nombre}`,
      servicioIds: (items ?? []).map((i) => i.service_id),
    },
  };
}