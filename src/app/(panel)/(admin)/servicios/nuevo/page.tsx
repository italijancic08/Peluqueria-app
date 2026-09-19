import { ServicioForm } from "@/components/servicios/servicio-form";

export default function NuevoServicioPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-neutral-900">Nuevo servicio</h1>
      <ServicioForm modo="crear" />
    </div>
  );
}