import { createClient } from "@/lib/supabase/server";
import { PresupuestoForm } from "@/components/presupuestos/presupuesto-form";
import { obtenerRecargoTarjeta } from "@/lib/recargo";

export default async function NuevoPresupuestoPage() {
  const supabase = await createClient();
  const [{ data: servicios }, recargoPct] = await Promise.all([
    supabase
      .from("services")
      .select("*, service_variants(*)")
      .eq("activo", true)
      .order("nombre"),
    obtenerRecargoTarjeta(),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-neutral-900">Nuevo presupuesto</h1>
      <PresupuestoForm servicios={servicios ?? []} recargoPct={recargoPct} />
    </div>
  );
}