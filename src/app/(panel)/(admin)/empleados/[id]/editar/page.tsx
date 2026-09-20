import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditarEmpleadoForm } from "@/components/empleados/editar-empleado-form";

export default async function EditarEmpleadoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: empleado } = await supabase.from("profiles").select("*").eq("id", id).single();

  if (!empleado) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-neutral-900">Editar empleado</h1>
      <EditarEmpleadoForm empleado={empleado} />
    </div>
  );
}