import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/guards";
import { Button } from "@/components/ui/button";
import { formatearTelefono } from "@/lib/format";
import { RUTAS } from "@/constants/routes";
import { eliminarCliente } from "@/actions/clients";

export default async function ClienteDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const perfil = await requireAuth();
  const supabase = await createClient();

  const { data: cliente } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  if (!cliente) notFound();

  async function borrar() {
    "use server";
    const resultado = await eliminarCliente(id);
    if (resultado.ok) redirect(RUTAS.clientes);
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900">
          {cliente.apellido}, {cliente.nombre}
        </h1>
        <div className="flex gap-2">
          <Link href={`${RUTAS.cliente(cliente.id)}/editar`}>
            <Button variant="secondary">Editar</Button>
          </Link>
          {perfil.rol === "ADMIN" && (
            <form action={borrar}>
              <Button type="submit" variant="danger">
                Eliminar
              </Button>
            </form>
          )}
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-neutral-500">Teléfono</dt>
          <dd className="text-neutral-900">{formatearTelefono(cliente.telefono)}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">DNI</dt>
          <dd className="text-neutral-900">{cliente.dni ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">Email</dt>
          <dd className="text-neutral-900">{cliente.email ?? "—"}</dd>
        </div>
      </dl>

      {cliente.notas && (
        <div>
          <h2 className="text-sm font-medium text-neutral-700 mb-1">Notas</h2>
          <p className="text-sm text-neutral-600 whitespace-pre-wrap">{cliente.notas}</p>
        </div>
      )}

      <div className="pt-4 border-t border-neutral-200">
        <h2 className="text-sm font-medium text-neutral-700 mb-1">Historial de trabajos</h2>
        <p className="text-sm text-neutral-500">
          Todavía no está disponible — se habilita cuando armemos el módulo de trabajos.
        </p>
      </div>
    </div>
  );
}