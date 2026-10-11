import { createClient } from "@/lib/supabase/server";
import { BusinessHoursForm } from "@/components/configuracion/business-hours-form";

export default async function HorariosPage() {
  const supabase = await createClient();
  const { data: horarios } = await supabase.from("business_hours").select("*");

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-neutral-900">Horarios de atención</h1>
      <p className="text-sm text-neutral-500">
        Desmarcá un día para que el negocio no ofrezca turnos ese día. Cada día tiene una franja de
        mañana y otra de tarde; si un día abrís de corrido o solo en un turno, dejá la tarde vacía.
      </p>
      <BusinessHoursForm horarios={horarios ?? []} />
    </div>
  );
}