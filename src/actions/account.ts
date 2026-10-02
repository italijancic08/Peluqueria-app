"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { checkAuth, checkAdmin } from "@/lib/auth/guards";
import { movimientoCCManualSchema, pagoCCSchema } from "@/lib/validations/account-movement";
import type { ActionResult } from "@/types/models";

export async function alternarCuentaCorriente(clientId: string, habilitada: boolean): Promise<ActionResult> {
  const perfil = await checkAdmin();
  if (!perfil) return { ok: false, error: "Solo un administrador puede habilitar cuenta corriente." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .update({ cuenta_corriente_habilitada: habilitada })
    .eq("id", clientId);

  if (error) return { ok: false, error: "No se pudo actualizar." };

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${clientId}`);
  revalidatePath("/cuenta-corriente");
  return { ok: true, data: undefined };
}

export async function crearMovimientoCCManual(valores: unknown): Promise<ActionResult> {
  const perfil = await checkAuth();
  if (!perfil) return { ok: false, error: "No autorizado." };

  const parsed = movimientoCCManualSchema.safeParse(valores);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisá los datos del formulario.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("account_movements").insert({
    client_id: parsed.data.clientId,
    tipo: parsed.data.tipo,
    monto: parsed.data.monto,
    descripcion: parsed.data.descripcion || null,
    created_by: perfil.id,
  });

  if (error) return { ok: false, error: "No se pudo registrar el movimiento." };

  revalidatePath(`/clientes/${parsed.data.clientId}`);
  revalidatePath("/cuenta-corriente");
  revalidatePath(`/cuenta-corriente/${parsed.data.clientId}`);
  return { ok: true, data: undefined };
}

export async function registrarPagoCC(valores: unknown): Promise<ActionResult> {
  const perfil = await checkAuth();
  if (!perfil) return { ok: false, error: "No autorizado." };

  const parsed = pagoCCSchema.safeParse(valores);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisá los datos del formulario.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("registrar_pago_cuenta_corriente", {
    p_client_id: parsed.data.clientId,
    p_monto: parsed.data.monto,
    p_metodo: parsed.data.metodo,
    p_descripcion: parsed.data.descripcion || "",
  });

  if (error) return { ok: false, error: error.message || "No se pudo registrar el pago." };

  revalidatePath(`/clientes/${parsed.data.clientId}`);
  revalidatePath("/cuenta-corriente");
  revalidatePath(`/cuenta-corriente/${parsed.data.clientId}`);
  revalidatePath("/caja");
  return { ok: true, data: undefined };
}