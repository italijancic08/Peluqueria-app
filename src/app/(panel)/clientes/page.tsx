import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { formatearTelefono } from "@/lib/format";
import { RUTAS } from "@/constants/routes";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("clients")
    .select("*")
    .eq("activo", true)
    .order("apellido", { ascending: true })
    .limit(50);

  if (q) {
    query = query.or(
      `nombre.ilike.%${q}%,apellido.ilike.%${q}%,telefono.ilike.%${q}%,email.ilike.%${q}%`
    );
  }

  const { data: clientes, error } = await query;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900">Clientes</h1>
        <Link href={`${RUTAS.clientes}/nuevo`}>
          <Button>Nuevo cliente</Button>
        </Link>
      </div>

      <form className="max-w-sm">
        <Input
          type="search"
          name="q"
          placeholder="Buscar por nombre, teléfono o email"
          defaultValue={q ?? ""}
        />
      </form>

      {error && (
        <p className="text-sm text-red-600">No se pudieron cargar los clientes.</p>
      )}

      {!error && clientes && clientes.length === 0 && (
        <p className="text-sm text-neutral-500">
          {q
            ? "No se encontraron clientes con ese criterio."
            : "Todavía no hay clientes cargados."}
        </p>
      )}

      {!error && clientes && clientes.length > 0 && (
        <Table>
          <Thead>
            <Tr>
              <Th>Nombre</Th>
              <Th>Teléfono</Th>
              <Th>Email</Th>
              <Th></Th>
            </Tr>
          </Thead>
          <Tbody>
            {clientes.map((cliente) => (
              <Tr key={cliente.id}>
                <Td>
                  {cliente.apellido}, {cliente.nombre}
                </Td>
                <Td>{formatearTelefono(cliente.telefono)}</Td>
                <Td>{cliente.email ?? "—"}</Td>
                <Td className="text-right">
                  <Link
                    href={RUTAS.cliente(cliente.id)}
                    className="text-sm text-neutral-900 underline"
                  >
                    Ver
                  </Link>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </div>
  );
}