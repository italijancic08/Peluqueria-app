import { createClient } from "@/lib/supabase/server";
import { ReservaForm } from "@/components/turnos/reserva-form";

export default async function ReservarTurnoPage() {
  const supabase = await createClient();
  const { data: servicios } = await supabase
    .from("services")
    .select("*")
    .eq("activo", true)
    .order("nombre");

  return (
    <div className="max-w-lg mx-auto py-10 px-4 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Reservar turno</h1>
        <p className="text-sm text-neutral-500">
          Elegí el servicio, el día y el horario que prefieras.
        </p>
      </div>
      <ReservaForm servicios={servicios ?? []} />
    </div>
  );
}