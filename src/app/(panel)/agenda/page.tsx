import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { SelectorFechaAgenda } from "@/components/turnos/selector-fecha-agenda";
import { CancelarTurnoButton } from "@/components/turnos/cancelar-turno-button";
import { mostrarHora } from "@/lib/dates";
import { estadoTurnoVista } from "@/lib/estado-turno";

export default async function TurnosPage({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string }>;
}) {
  const { fecha } = await searchParams;
  const fechaConsulta = fecha ?? new Date().toISOString().slice(0, 10);
  const ahora = new Date().getTime();

  const supabase = await createClient();
  await supabase.rpc("expirar_turnos_vencidos");

  const { data: settings } = await supabase
    .from("business_settings")
    .select("aviso_sin_tomar_min")
    .eq("id", 1)
    .single();
  const avisoMin = settings?.aviso_sin_tomar_min ?? 60;

  const { data: turnos, error } = await supabase
    .from("appointments")
    .select(
      "*, clients(nombre, apellido, telefono), works(estado, profile_id, profiles(nombre, apellido))"
    )
    .gte("fecha_hora_inicio", `${fechaConsulta}T00:00:00`)
    .lt("fecha_hora_inicio", `${fechaConsulta}T23:59:59`)
    .order("fecha_hora_inicio");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900">Turnos</h1>
              <Link href="/agenda/nuevo">
          <Button>Nuevo turno</Button>
        </Link>
      </div>

      <SelectorFechaAgenda fecha={fechaConsulta} />

      {error && <p className="text-sm text-red-600">No se pudieron cargar los turnos.</p>}

      {!error && turnos && turnos.length === 0 && (
        <p className="text-sm text-neutral-500">No hay turnos para ese día.</p>
      )}

      {!error && turnos && turnos.length > 0 && (
        <Table>
          <Thead>
            <Tr>
              <Th>Hora</Th>
              <Th>Cliente</Th>
              <Th>Atiende</Th>
              <Th>Estado</Th>
              <Th></Th>
            </Tr>
          </Thead>
          <Tbody>
            {turnos.map((t) => {
              const trabajo = Array.isArray(t.works) ? t.works[0] : t.works;
              const vista = estadoTurnoVista({
                estadoTurno: t.estado,
                estadoTrabajo: trabajo?.estado,
                inicio: t.fecha_hora_inicio,
                ahora,
                avisoMin,
              });
              const atiende = trabajo?.profiles
                ? `${trabajo.profiles.nombre} ${trabajo.profiles.apellido}`
                : trabajo?.profile_id
                  ? "Asignado"
                  : "Sin asignar";

              return (
                <Tr key={t.id}>
                  <Td>{mostrarHora(t.fecha_hora_inicio)}</Td>
                  <Td>
                    {t.clients?.apellido}, {t.clients?.nombre}
                  </Td>
                  <Td>{atiende}</Td>
                  <Td>
                    <Badge variant={vista.variante}>{vista.etiqueta}</Badge>
                  </Td>
                  <Td className="text-right">
                    {vista.puedeCancelar && <CancelarTurnoButton id={t.id} />}
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