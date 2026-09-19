import { ClienteForm } from "@/components/clientes/cliente-form";

export default function NuevoClientePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-neutral-900">Nuevo cliente</h1>
      <ClienteForm modo="crear" />
    </div>
  );
}