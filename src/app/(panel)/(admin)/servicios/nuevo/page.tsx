import { ServicioForm } from "@/components/servicios/servicio-form";
import { obtenerRecargoTarjeta } from "@/lib/recargo";

export default async function NuevoServicioPage() {
  const recargoPct = await obtenerRecargoTarjeta();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-neutral-900">Nuevo servicio</h1>
      <ServicioForm modo="crear" recargoPct={recargoPct} />
    </div>
  );
}