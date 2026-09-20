import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/stat-card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { formatearPesos } from "@/lib/format";
import { TrendingUp, TrendingDown, Scissors, Trophy } from "lucide-react";

function primerYUltimoDelMes() {
  const hoy = new Date();
  const primero = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const ultimo = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59);
  return { primero, ultimo };
}

export default async function EstadisticasPage() {
  const supabase = await createClient();
  const { primero, ultimo } = primerYUltimoDelMes();

  const [{ data: movimientosMes }, { data: workItemsMes }, { data: comisionesMes }] = await Promise.all([
    supabase
      .from("cash_movements")
      .select("monto, tipo")
      .gte("created_at", primero.toISOString())
      .lte("created_at", ultimo.toISOString()),
    supabase
      .from("work_items")
      .select("service_id, services(nombre), works!inner(created_at, estado)")
      .gte("works.created_at", primero.toISOString())
      .lte("works.created_at", ultimo.toISOString()),
    supabase
      .from("employee_commissions")
      .select("monto, profile_id, profiles(nombre, apellido)")
      .gte("created_at", primero.toISOString())
      .lte("created_at", ultimo.toISOString()),
  ]);

  let ingresosMes = 0;
  let egresosMes = 0;
  for (const m of movimientosMes ?? []) {
    if (m.tipo === "INGRESO") ingresosMes += Number(m.monto);
    else egresosMes += Number(m.monto);
  }

  const trabajosCobradosMes = new Set(
    (workItemsMes ?? [])
      .filter((wi: any) => wi.works?.estado === "COBRADO")
      .map((wi: any) => wi.service_id)
  ).size;

  const conteoServicios = new Map<string, number>();
  for (const wi of workItemsMes ?? []) {
    const nombre = (wi as any).services?.nombre ?? "—";
    conteoServicios.set(nombre, (conteoServicios.get(nombre) ?? 0) + 1);
  }
  const serviciosOrdenados = Array.from(conteoServicios.entries()).sort((a, b) => b[1] - a[1]);

  const comisionPorEmpleado = new Map<string, { nombre: string; total: number }>();
  for (const c of comisionesMes ?? []) {
    const nombre = `${(c as any).profiles?.apellido}, ${(c as any).profiles?.nombre}`;
    const actual = comisionPorEmpleado.get(c.profile_id) ?? { nombre, total: 0 };
    actual.total += Number(c.monto);
    comisionPorEmpleado.set(c.profile_id, actual);
  }
  const empleadosOrdenados = Array.from(comisionPorEmpleado.values()).sort((a, b) => b.total - a.total);

  const nombreMes = primero.toLocaleDateString("es-AR", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#4A3428]">Estadísticas</h1>
        <p className="text-sm text-[#9C8577] capitalize">{nombreMes}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Ingresos del mes" value={formatearPesos(ingresosMes)} icon={TrendingUp} />
        <StatCard label="Egresos del mes" value={formatearPesos(egresosMes)} icon={TrendingDown} tono="alerta" />
        <StatCard label="Balance del mes" value={formatearPesos(ingresosMes - egresosMes)} icon={Scissors} />
        <StatCard
          label="Empleado con más comisión"
          value={empleadosOrdenados[0]?.nombre ?? "—"}
          icon={Trophy}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm font-medium text-[#4A3428] mb-2">Servicios más realizados</h2>
          {serviciosOrdenados.length === 0 && (
            <p className="text-sm text-[#9C8577]">Sin datos este mes.</p>
          )}
          {serviciosOrdenados.length > 0 && (
            <Table>
              <Thead>
                <Tr>
                  <Th>Servicio</Th>
                  <Th>Cantidad</Th>
                </Tr>
              </Thead>
              <Tbody>
                {serviciosOrdenados.slice(0, 8).map(([nombre, cantidad]) => (
                  <Tr key={nombre}>
                    <Td>{nombre}</Td>
                    <Td>{cantidad}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </div>

        <div>
          <h2 className="text-sm font-medium text-[#4A3428] mb-2">Comisión generada por empleado</h2>
          {empleadosOrdenados.length === 0 && (
            <p className="text-sm text-[#9C8577]">Sin datos este mes.</p>
          )}
          {empleadosOrdenados.length > 0 && (
            <Table>
              <Thead>
                <Tr>
                  <Th>Empleado</Th>
                  <Th>Comisión</Th>
                </Tr>
              </Thead>
              <Tbody>
                {empleadosOrdenados.map((e) => (
                  <Tr key={e.nombre}>
                    <Td>{e.nombre}</Td>
                    <Td>{formatearPesos(e.total)}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}