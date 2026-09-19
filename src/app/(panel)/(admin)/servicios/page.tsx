import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { ToggleActivo } from "@/components/servicios/toggle-activo";
import { formatearPesos } from "@/lib/format";

export default async function ServiciosPage() {
  const supabase = await createClient();

  const { data: servicios, error } = await supabase
    .from("services")
    .select("*")
    .order("nombre", { ascending: true });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900">Servicios</h1>
        <Link href="/servicios/nuevo">
          <Button>Nuevo servicio</Button>
        </Link>
      </div>

      {error && (
        <p className="text-sm text-red-600">No se pudieron cargar los servicios.</p>
      )}

      {!error && servicios && servicios.length === 0 && (
        <p className="text-sm text-neutral-500">Todavía no hay servicios cargados.</p>
      )}

      {!error && servicios && servicios.length > 0 && (
        <Table>
          <Thead>
            <Tr>
              <Th>Nombre</Th>
              <Th>Precio</Th>
              <Th>Duración</Th>
              <Th>Estado</Th>
              <Th></Th>
            </Tr>
          </Thead>
          <Tbody>
            {servicios.map((servicio) => (
              <Tr key={servicio.id}>
                <Td>{servicio.nombre}</Td>
                <Td>{formatearPesos(servicio.precio)}</Td>
                <Td>{servicio.duracion_min} min</Td>
                <Td>
                  <Badge variant={servicio.activo ? "success" : "neutral"}>
                    {servicio.activo ? "Activo" : "Inactivo"}
                  </Badge>
                </Td>
                <Td className="text-right space-x-2">
                  <Link
                    href={`/servicios/${servicio.id}/editar`}
                    className="text-sm text-neutral-900 underline"
                  >
                    Editar
                  </Link>
                  <ToggleActivo id={servicio.id} activo={servicio.activo} />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </div>
  );
}