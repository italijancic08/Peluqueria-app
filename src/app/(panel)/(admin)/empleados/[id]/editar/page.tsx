import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditarEmpleadoForm } from "@/components/empleados/editar-empleado-form";
import { FotoPerfilUploader } from "@/components/perfil/foto-perfil-uploader";
import { ToggleVisibilidadPublica } from "@/components/empleados/toggle-visibilidad-publica";

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
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-neutral-900">Editar empleado</h1>

      <FotoPerfilUploader
        profileId={empleado.id}
        fotoUrl={empleado.foto_url}
        nombre={`${empleado.nombre} ${empleado.apellido}`}
      />

      <ToggleVisibilidadPublica id={empleado.id} visible={empleado.visible_publico} />

      <EditarEmpleadoForm empleado={empleado} />
    </div>
  );
}