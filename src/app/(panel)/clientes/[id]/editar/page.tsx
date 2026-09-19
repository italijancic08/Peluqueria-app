import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClienteForm } from "@/components/clientes/cliente-form";

export default async function EditarClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: cliente } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  if (!cliente) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-neutral-900">Editar cliente</h1>
      <ClienteForm modo="editar" cliente={cliente} />
    </div>
  );
}