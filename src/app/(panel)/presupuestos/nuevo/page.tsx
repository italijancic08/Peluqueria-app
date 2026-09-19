import { createClient } from "@/lib/supabase/server";
import { PresupuestoForm } from "@/components/presupuestos/presupuesto-form";

export default async function NuevoPresupuestoPage() {
  const supabase = await createClient();
  const { data: servicios } = await supabase
    .from("services")
    .select("*")
    .eq("activo", true)
    .order("nombre");

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-neutral-900">Nuevo presupuesto</h1>
      <PresupuestoForm servicios={servicios ?? []} />
    </div>
  );
}