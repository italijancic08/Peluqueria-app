import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/guards";
import { obtenerPresupuestoParaTurno } from "@/actions/budgets";
import { TurnoInternoForm } from "@/components/turnos/turno-interno-form";
import { obtenerRecargoTarjeta } from "@/lib/recargo";

export default async function NuevoTurnoPage({
  searchParams,
}: {
  searchParams: Promise<{ budgetId?: string }>;
}) {
  const { budgetId } = await searchParams;
  const perfil = await requireAuth();
  const esAdmin = perfil.rol === "ADMIN";
  const supabase = await createClient();
  const [{ data: servicios }, recargoPct, { data: empleados }] = await Promise.all([
    supabase
      .from("services")
      .select("*, service_variants(*)")
      .eq("activo", true)
      .order("nombre"),
    obtenerRecargoTarjeta(),
    esAdmin
      ? supabase
          .from("profiles")
          .select("id, nombre, apellido")
          .eq("activo", true)
          .order("apellido")
      : Promise.resolve({ data: null }),
  ]);

  let presupuesto = null;
  if (budgetId) {
    const resultado = await obtenerPresupuestoParaTurno(budgetId);
    if (resultado.ok) presupuesto = { budgetId, ...resultado.data };
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-neutral-900">Nuevo turno</h1>
      <TurnoInternoForm
        servicios={servicios ?? []}
        presupuesto={presupuesto}
        recargoPct={recargoPct}
        esAdmin={esAdmin}
        perfilId={perfil.id}
        empleados={empleados ?? []}
      />
    </div>
  );
}