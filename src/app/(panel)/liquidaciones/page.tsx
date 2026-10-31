import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/guards";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LiquidarSemanaButton } from "@/components/liquidaciones/liquidar-semana-button";
import { MarcarPagadaButton } from "@/components/liquidaciones/marcar-pagada-button";
import { ComisionManualForm } from "@/components/liquidaciones/comision-manual-form";
import { formatearPesos } from "@/lib/format";
import { format } from "date-fns";
import { hoyISO, mostrarDia, semanaLaboral } from "@/lib/dates";

export default async function LiquidacionesPage() {
  const perfil = await requireAuth();
  const supabase = await createClient();

  const { inicio, fin } = semanaLaboral(new Date(`${hoyISO()}T12:00:00`));
  const semanaInicioISO = format(inicio, "yyyy-MM-dd");
  const semanaFinISO = format(fin, "yyyy-MM-dd");

  let queryComisionesPendientes = supabase
    .from("employee_commissions")
    .select("*, profiles(nombre, apellido)")
    .is("settlement_id", null);

  let queryLiquidaciones = supabase
    .from("employee_settlements")
    .select("*, profiles!employee_settlements_profile_id_fkey(nombre, apellido)")
    .order("semana_inicio", { ascending: false })
    .limit(30);

  if (perfil.rol !== "ADMIN") {
    queryComisionesPendientes = queryComisionesPendientes.eq("profile_id", perfil.id);
    queryLiquidaciones = queryLiquidaciones.eq("profile_id", perfil.id);
  }

  const queryEmpleados = supabase
    .from("profiles")
    .select("id, nombre, apellido, comision_pct")
    .eq("activo", true)
    .order("apellido", { ascending: true });

  const [{ data: comisionesPendientes }, { data: liquidaciones }, { data: empleados }] =
    await Promise.all([queryComisionesPendientes, queryLiquidaciones, queryEmpleados]);

  type PendienteEmpleado = { nombre: string; total: number };
  const pendientesPorEmpleado = new Map<string, PendienteEmpleado>();

  for (const c of comisionesPendientes ?? []) {
    const key = c.profile_id;
    const nombre = `${c.profiles?.apellido}, ${c.profiles?.nombre}`;
    const actual = pendientesPorEmpleado.get(key) ?? { nombre, total: 0 };
    actual.total += Number(c.monto);
    pendientesPorEmpleado.set(key, actual);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-neutral-900">
          {perfil.rol === "ADMIN" ? "Liquidaciones" : "Mis liquidaciones"}
        </h1>
        {perfil.rol === "ADMIN" && <ComisionManualForm empleados={empleados ?? []} />}
      </div>

      {perfil.rol === "ADMIN" && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-neutral-700">
            Comisiones pendientes — semana actual {mostrarDia(semanaInicioISO)} al {mostrarDia(semanaFinISO)}
          </h2>
          {pendientesPorEmpleado.size === 0 && (
            <p className="text-sm text-neutral-500">No hay comisiones pendientes de liquidar.</p>
          )}
          {Array.from(pendientesPorEmpleado.entries()).map(([profileId, info]) => (
            <div
              key={profileId}
              className="flex items-center justify-between rounded-md border border-neutral-200 bg-white p-3"
            >
              <div>
                <p className="text-sm font-medium text-neutral-900">{info.nombre}</p>
                <p className="text-sm text-neutral-500">{formatearPesos(info.total)}</p>
              </div>
              <LiquidarSemanaButton
                profileId={profileId}
                semanaInicio={semanaInicioISO}
                semanaFin={semanaFinISO}
              />
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-neutral-700">Historial de liquidaciones</h2>
        {liquidaciones && liquidaciones.length === 0 && (
          <p className="text-sm text-neutral-500">Todavía no hay liquidaciones generadas.</p>
        )}
        {liquidaciones && liquidaciones.length > 0 && (
          <Table>
            <Thead>
              <Tr>
                {perfil.rol === "ADMIN" && <Th>Empleado</Th>}
                <Th>Semana</Th>
                <Th>Total</Th>
                <Th>Estado</Th>
                <Th></Th>
              </Tr>
            </Thead>
            <Tbody>
              {liquidaciones.map((l) => (
                <Tr key={l.id}>
                  {perfil.rol === "ADMIN" && (
                    <Td>
                      {l.profiles?.apellido}, {l.profiles?.nombre}
                    </Td>
                  )}
                  <Td>
                    {mostrarDia(l.semana_inicio)} — {mostrarDia(l.semana_fin)}
                  </Td>
                  <Td>{formatearPesos(l.total)}</Td>
                  <Td>
                    <Badge variant={l.estado === "PAGADA" ? "success" : "neutral"}>
                      {l.estado === "PAGADA" ? "Pagada" : "Pendiente"}
                    </Badge>
                  </Td>
                  <Td className="text-right">
                    {perfil.rol === "ADMIN" && l.estado === "PENDIENTE" && (
                      <MarcarPagadaButton settlementId={l.id} />
                    )}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </div>
    </div>
  );
}