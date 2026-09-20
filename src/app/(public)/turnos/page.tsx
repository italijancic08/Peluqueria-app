import { Scissors } from "lucide-react";
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
    <div className="min-h-screen flex items-start sm:items-center justify-center py-6 sm:py-10 px-4">
      <div className="w-full max-w-md md:max-w-xl bg-white rounded-2xl shadow-sm border border-[#EDD9C4] p-5 sm:p-8 space-y-6">
        <div className="flex flex-col items-center text-center gap-2">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#6B4635]">
            <Scissors className="h-6 w-6 text-white" />
          </span>
          <h1 className="text-xl font-semibold text-[#4A3428] font-[family-name:var(--font-display)]">
            Reservar turno
          </h1>
          <p className="text-sm text-[#9C8577]">
            Elegí el servicio, el día y el horario que prefieras.
          </p>
        </div>

        <ReservaForm servicios={servicios ?? []} />
      </div>
    </div>
  );
}