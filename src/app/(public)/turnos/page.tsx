import { createClient } from "@/lib/supabase/server";
import { ReservaForm } from "@/components/turnos/reserva-form";
import { BuscarTurnoForm } from "@/components/turnos/buscar-turno-form";
import { TurnosTabs } from "@/components/turnos/turnos-tabs";

export default async function ReservarTurnoPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;

  const supabase = await createClient();
  const [{ data: servicios }, { data: equipo }] = await Promise.all([
    supabase.from("services").select("*").eq("activo", true).order("nombre"),
    supabase.rpc("equipo_publico"),
  ]);

  return (
    <div className="min-h-screen flex items-start sm:items-center justify-center py-6 sm:py-10 px-4">
      <div className="w-full max-w-md md:max-w-xl bg-white rounded-2xl shadow-sm border border-[#EDD9C4] p-5 sm:p-8">
        <TurnosTabs
          inicial={tab === "gestionar" ? "gestionar" : "reservar"}
          reservar={<ReservaForm servicios={servicios ?? []} equipo={equipo ?? []} />}
          gestionar={<BuscarTurnoForm />}
        />
      </div>
    </div>
  );
}