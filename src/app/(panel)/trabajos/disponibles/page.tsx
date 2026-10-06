import { createClient } from "@/lib/supabase/server";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TomarTrabajoButton } from "@/components/trabajos/tomar-trabajo-button";
import { formatearPesos } from "@/lib/format";
import { mostrarFechaHora } from "@/lib/dates";

export default async function TrabajosDisponiblesPage() {
  const supabase = await createClient();
  await supabase.rpc("expirar_turnos_vencidos");

  const { data: settings } = await supabase
    .from("business_settings")
    .select("aviso_sin_tomar_min")
    .eq("id", 1)
    .single();
  const avisoMs = (settings?.aviso_sin_tomar_min ?? 60) * 60000;
  const ahora = new Date().getTime();

  const { data, error } = await supabase
    .from("works")
    .select("*, clients(nombre, apellido), appointments(fecha_hora_inicio)")
    .eq("estado", "DISPONIBLE");

  // Los turnos más próximos primero
  const trabajos = (data ?? []).slice().sort((a, b) => {
    const ta = a.appointments ? new Date(a.appointments.fecha_hora_inicio).getTime() : Infinity;
    const tb = b.appointments ? new Date(b.appointments.fecha_hora_inicio).getTime() : Infinity;
    return ta - tb;
  });

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
            {trabajos.map((t) => {
              const inicio = t.appointments ? new Date(t.appointments.fecha_hora_inicio).getTime() : null;
              const demorado = inicio !== null && inicio < ahora;
              const urgente = inicio !== null && !demorado && inicio - ahora <= avisoMs;

              return (
                <Tr key={t.id}>
                  <Td>
                    {t.appointments ? mostrarFechaHora(t.appointments.fecha_hora_inicio) : "—"}
                    {demorado && (
                      <span className="ml-2">
                        <Badge variant="warning">Demorado</Badge>
                      </span>
                    )}
                    {urgente && (
                      <span className="ml-2">
                        <Badge variant="danger">Urgente</Badge>
                      </span>
                    )}
                  </Td>
                  <Td>
                    {t.clients?.apellido}, {t.clients?.nombre}
                  </Td>
                  <Td>{formatearPesos(t.total)}</Td>
                  <Td className="text-right">
                    <TomarTrabajoButton id={t.id} />
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      )}
    </div>
  );
}