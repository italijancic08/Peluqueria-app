import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/stat-card";
import { BarraHorizontal } from "@/components/estadisticas/barra-horizontal";
import { ClienteTopCard } from "@/components/estadisticas/cliente-top-card";
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

  const [{ data: movimientosMes }, { data: workItemsMes }, { data: comisionesMes }, { data: trabajosCobradosMes }] =
    await Promise.all([
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
      supabase
        .from("works")
        .select("total, client_id, clients(nombre, apellido)")
        .eq("estado", "COBRADO")
        .gte("cobrado_at", primero.toISOString())
        .lte("cobrado_at", ultimo.toISOString()),
    ]);

  let ingresosMes = 0;
  let egresosMes = 0;
  for (const m of movimientosMes ?? []) {
    if (m.tipo === "INGRESO") ingresosMes += Number(m.monto);
    else egresosMes += Number(m.monto);
  }

  const conteoServicios = new Map<string, number>();
  for (const wi of workItemsMes ?? []) {
    const nombre = (wi as any).services?.nombre ?? "—";
    conteoServicios.set(nombre, (conteoServicios.get(nombre) ?? 0) + 1);
  }
  const serviciosOrdenados = Array.from(conteoServicios.entries()).sort((a, b) => b[1] - a[1]);
  const maximoServicio = serviciosOrdenados[0]?.[1] ?? 0;

  const comisionPorEmpleado = new Map<string, { nombre: string; total: number }>();
  for (const c of comisionesMes ?? []) {
    const nombre = `${(c as any).profiles?.apellido}, ${(c as any).profiles?.nombre}`;
    const actual = comisionPorEmpleado.get(c.profile_id) ?? { nombre, total: 0 };
    actual.total += Number(c.monto);
    comisionPorEmpleado.set(c.profile_id, actual);
  }
  const empleadosOrdenados = Array.from(comisionPorEmpleado.values()).sort((a, b) => b.total - a.total);
  const maximoComision = empleadosOrdenados[0]?.total ?? 0;

  const gastoPorCliente = new Map<string, { nombre: string; total: number }>();
  for (const w of trabajosCobradosMes ?? []) {
    const nombre = w.clients ? `${(w as any).clients.apellido}, ${(w as any).clients.nombre}` : "—";
    const actual = gastoPorCliente.get(w.client_id) ?? { nombre, total: 0 };
    actual.total += Number(w.total);
    gastoPorCliente.set(w.client_id, actual);
  }
  const clientesOrdenados = Array.from(gastoPorCliente.values()).sort((a, b) => b.total - a.total);
  const clienteTop = clientesOrdenados[0] ?? null;

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

      <ClienteTopCard nombre={clienteTop?.nombre ?? null} total={clienteTop?.total ?? 0} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-[#EDD9C4] bg-white p-4 space-y-3">
          <h2 className="text-sm font-medium text-[#4A3428]">Servicios más realizados</h2>
          {serviciosOrdenados.length === 0 && (
            <p className="text-sm text-[#9C8577]">Sin datos este mes.</p>
          )}
          {serviciosOrdenados.slice(0, 6).map(([nombre, cantidad]) => (
            <BarraHorizontal
              key={nombre}
              label={nombre}
              valor={cantidad}
              maximo={maximoServicio}
              valorFormateado={String(cantidad)}
            />
          ))}
        </div>

        <div className="rounded-xl border border-[#EDD9C4] bg-white p-4 space-y-3">
          <h2 className="text-sm font-medium text-[#4A3428]">Comisión generada por empleado</h2>
          {empleadosOrdenados.length === 0 && (
            <p className="text-sm text-[#9C8577]">Sin datos este mes.</p>
          )}
          {empleadosOrdenados.map((e) => (
            <BarraHorizontal
              key={e.nombre}
              label={e.nombre}
              valor={e.total}
              maximo={maximoComision}
              valorFormateado={formatearPesos(e.total)}
            />
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-[#EDD9C4] bg-white p-4 space-y-3">
        <h2 className="text-sm font-medium text-[#4A3428]">Clientes que más gastaron</h2>
        {clientesOrdenados.length === 0 && (
          <p className="text-sm text-[#9C8577]">Sin datos este mes.</p>
        )}
        {clientesOrdenados.slice(0, 8).map((c) => (
          <BarraHorizontal
            key={c.nombre}
            label={c.nombre}
            valor={c.total}
            maximo={clienteTop?.total ?? 0}
            valorFormateado={formatearPesos(c.total)}
          />
        ))}
      </div>
    </div>
  );
}