import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { ToggleActivoEmpleado } from "@/components/empleados/toggle-activo-empleado";

export default async function EmpleadosPage() {
  const supabase = await createClient();

  const { data: empleados, error } = await supabase
    .from("profiles")
    .select("*")
    .order("apellido", { ascending: true });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900">Empleados</h1>
        <Link href="/empleados/nuevo">
          <Button>Nuevo empleado</Button>
        </Link>
      </div>

      {error && <p className="text-sm text-red-600">No se pudieron cargar los empleados.</p>}

      {!error && empleados && empleados.length > 0 && (
        <Table>
          <Thead>
            <Tr>
              <Th>Nombre</Th>
              <Th>Email</Th>
              <Th>Rol</Th>
              <Th>Comisión</Th>
              <Th>Estado</Th>
              <Th></Th>
            </Tr>
          </Thead>
          <Tbody>
            {empleados.map((e) => (
              <Tr key={e.id}>
                <Td>
                  {e.apellido}, {e.nombre}
                </Td>
                <Td>{e.email ?? "—"}</Td>
                <Td>{e.rol === "ADMIN" ? "Administrador" : "Empleado"}</Td>
                <Td>{Number(e.comision_pct)}%</Td>
                <Td>
                  <Badge variant={e.activo ? "success" : "neutral"}>
                    {e.activo ? "Activo" : "Inactivo"}
                  </Badge>
                </Td>
                <Td className="text-right space-x-2">
                  <Link href={`/empleados/${e.id}/editar`} className="text-sm text-neutral-900 underline">
                    Editar
                  </Link>
                  <ToggleActivoEmpleado id={e.id} activo={e.activo} />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </div>
  );
}