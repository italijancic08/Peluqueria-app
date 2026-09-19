import { createClient } from "@/lib/supabase/server";
import { obtenerPresupuestoParaTurno } from "@/actions/budgets";
import { TurnoInternoForm } from "@/components/turnos/turno-interno-form";

export default async function NuevoTurnoPage({
  searchParams,
}: {
  searchParams: Promise<{ budgetId?: string }>;
}) {
  const { budgetId } = await searchParams;
  const supabase = await createClient();
  const { data: servicios } = await supabase
    .from("services")
    .select("*")
    .eq("activo", true)
    .order("nombre");

  let presupuesto = null;
  if (budgetId) {
    const resultado = await obtenerPresupuestoParaTurno(budgetId);
    if (resultado.ok) presupuesto = { budgetId, ...resultado.data };
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-neutral-900">Nuevo turno</h1>
      <TurnoInternoForm servicios={servicios ?? []} presupuesto={presupuesto} />
    </div>
  );
}