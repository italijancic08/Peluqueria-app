import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ServicioForm } from "@/components/servicios/servicio-form";

export default async function EditarServicioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: servicio } = await supabase
    .from("services")
    .select("*")
    .eq("id", id)
    .single();

  if (!servicio) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-neutral-900">Editar servicio</h1>
      <ServicioForm modo="editar" servicio={servicio} />
    </div>
  );
}