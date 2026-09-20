import { EmpleadoForm } from "@/components/empleados/empleado-form";

export default function NuevoEmpleadoPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-neutral-900">Nuevo empleado</h1>
      <EmpleadoForm />
    </div>
  );
}