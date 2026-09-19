import { createClient } from "@/lib/supabase/server";
import { TurnoInternoForm } from "@/components/turnos/turno-interno-form";

export default async function NuevoTurnoPage() {
  const supabase = await createClient();
  const { data: servicios } = await supabase
    .from("services")
    .select("*")
    .eq("activo", true)
    .order("nombre");

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-neutral-900">Nuevo turno</h1>
      <TurnoInternoForm servicios={servicios ?? []} />
    </div>
  );
}