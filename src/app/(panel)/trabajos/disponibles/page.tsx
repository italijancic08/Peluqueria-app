import { createClient } from "@/lib/supabase/server";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { TomarTrabajoButton } from "@/components/trabajos/tomar-trabajo-button";
import { formatearPesos } from "@/lib/format";
import { mostrarFechaHora } from "@/lib/dates";

export default async function TrabajosDisponiblesPage() {
  const supabase = await createClient();

  const { data: trabajos, error } = await supabase
    .from("works")
    .select("*, clients(nombre, apellido), appointments(fecha_hora_inicio)")
    .eq("estado", "DISPONIBLE")
    .order("created_at");

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-neutral-900">Trabajos disponibles</h1>

      {error && <p className="text-sm text-red-600">No se pudieron cargar los trabajos.</p>}
      {!error && trabajos && trabajos.length === 0 && (
        <p className="text-sm text-neutral-500">No hay trabajos disponibles por el momento.</p>
      )}

      {!error && trabajos && trabajos.length > 0 && (
        <Table>
          <Thead>
            <Tr>
              <Th>Turno</Th>
              <Th>Cliente</Th>
              <Th>Total</Th>
              <Th></Th>
            </Tr>
          </Thead>
          <Tbody>
            {trabajos.map((t) => (
              <Tr key={t.id}>
                <Td>{t.appointments ? mostrarFechaHora(t.appointments.fecha_hora_inicio) : "—"}</Td>
                <Td>
                  {t.clients?.apellido}, {t.clients?.nombre}
                </Td>
                <Td>{formatearPesos(t.total)}</Td>
                <Td className="text-right">
                  <TomarTrabajoButton id={t.id} />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </div>
  );
}