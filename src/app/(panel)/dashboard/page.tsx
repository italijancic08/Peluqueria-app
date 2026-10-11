import Link from "next/link";
import {
  CalendarCheck,
  Scissors,
  Wallet,
  HandCoins,
  PackageX,
  Banknote,
  FileText,
  Users,
  FileSignature,
  Package,
  UserCog,
  Sparkles,
  ChartBar,
  Settings2,
  CalendarDays,
  Landmark,
  CircleUser,
} from "lucide-react";
import { QuickLinkCard } from "@/components/dashboard/quick-link-card";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/guards";
import { StatCard } from "@/components/dashboard/stat-card";
import { AlertaTurnosSinTomar } from "@/components/dashboard/alerta-turnos-sin-tomar";
import { contarTurnosSinTomar } from "@/lib/turnos-sin-tomar";
import { NotificacionesTurnos } from "@/components/dashboard/notificaciones-turnos";
import {
  cargarCancelacionesCliente,
  cargarReprogramacionesPendientes,
} from "@/lib/notificaciones-turnos";
import { formatearPesos } from "@/lib/format";

export default async function DashboardPage() {
  const perfil = await requireAuth();
  const supabase = await createClient();
  await supabase.rpc("expirar_turnos_vencidos");
  const sinTomar = await contarTurnosSinTomar(supabase);
  const [cancelaciones, reprogramaciones] = await Promise.all([
    cargarCancelacionesCliente(supabase),
    cargarReprogramacionesPendientes(supabase),
  ]);

  const hoyInicio = new Date();
  hoyInicio.setHours(0, 0, 0, 0);
  const hoyFin = new Date();
  hoyFin.setHours(23, 59, 59, 999);

  if (perfil.rol === "ADMIN") {
    const [
      { count: turnosHoy },
      { count: trabajosDisponibles },
      { data: movimientosHoyData },
      { data: movimientosEfectivoTodos },
      { data: comisionesPendientesData },
      { count: stockBajo },
    ] = await Promise.all([
      supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .gte("fecha_hora_inicio", hoyInicio.toISOString())
        .lte("fecha_hora_inicio", hoyFin.toISOString())
        .neq("estado", "CANCELADO"),
      supabase
        .from("works")
        .select("*", { count: "exact", head: true })
        .eq("estado", "DISPONIBLE"),
      supabase
        .from("cash_movements")
        .select("monto, tipo")
        .gte("created_at", hoyInicio.toISOString())
        .lte("created_at", hoyFin.toISOString()),
      supabase
        .from("cash_movements")
        .select("monto, tipo")
        .eq("metodo", "EFECTIVO"),
      supabase.from("employee_commissions").select("monto").is("settlement_id", null),
      supabase
        .from("products")
        .select("id, cantidad_actual, stock_minimo", { count: "exact" })
        .eq("activo", true),
    ]);

    let ingresosHoy = 0;
    for (const m of movimientosHoyData ?? []) {
      ingresosHoy += m.tipo === "INGRESO" ? Number(m.monto) : -Number(m.monto);
    }

    let cajaFisicaHoy = 0;
    for (const m of movimientosEfectivoTodos ?? []) {
      cajaFisicaHoy += m.tipo === "INGRESO" ? Number(m.monto) : -Number(m.monto);
    }

    const comisionesPendientes = (comisionesPendientesData ?? []).reduce(
      (acc, c) => acc + Number(c.monto),
      0
    );

    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#4A3428]">Dashboard</h1>
            <p className="text-sm text-[#9C8577]">Resumen de hoy.</p>
          </div>
          <Link
            href="/documentos"
            className="flex items-center gap-2 rounded-lg bg-[#6B4635] px-3 py-2 text-xs text-white hover:bg-[#5A3A2C] transition-colors"
          >
            <FileText className="h-4 w-4" />
            Documentos
          </Link>
        </div>

        <AlertaTurnosSinTomar cantidad={sinTomar.cantidad} avisoMin={sinTomar.avisoMin} />

        <NotificacionesTurnos cancelaciones={cancelaciones} reprogramaciones={reprogramaciones} />

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 space-y-4 sm:border-r sm:border-dashed sm:border-[#D9C4A8] sm:pr-4">
            <Link href="/caja">
              <StatCard label="Ingresos de hoy" value={formatearPesos(ingresosHoy)} icon={Wallet} />
            </Link>
            <Link href="/caja">
              <StatCard label="Caja física" value={formatearPesos(cajaFisicaHoy)} icon={Banknote} />
            </Link>
          </div>

          <div className="flex-1 space-y-4 sm:border-r sm:border-dashed sm:border-[#D9C4A8] sm:pr-4">
            <Link href="/trabajos/disponibles">
              <StatCard label="Trabajos disponibles" value={String(trabajosDisponibles ?? 0)} icon={Scissors} />
            </Link>
            <Link href="/stock">
              <StatCard
                label="Productos con stock bajo"
                value={String(stockBajo ?? 0)}
                icon={PackageX}
                tono="alerta"
              />
            </Link>
          </div>

          <div className="flex-1 space-y-4">
            <Link href="/agenda">
              <StatCard label="Turnos hoy" value={String(turnosHoy ?? 0)} icon={CalendarCheck} />
            </Link>
            <Link href="/liquidaciones">
              <StatCard
                label="Comisiones sin liquidar"
                value={formatearPesos(comisionesPendientes)}
                icon={HandCoins}
              />
            </Link>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-medium text-[#4A3428] mb-3">Accesos rápidos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <QuickLinkCard href="/clientes" label="Clientes" descripcion="Buscar y editar clientes" icon={Users} />
            <QuickLinkCard href="/agenda" label="Agenda" descripcion="Turnos del día y próximos" icon={CalendarDays} />
            <QuickLinkCard href="/presupuestos" label="Presupuestos" descripcion="Pendientes, aceptados y rechazados" icon={FileSignature} />
            <QuickLinkCard href="/trabajos" label="Trabajos" descripcion="En curso, finalizados y cobrados" icon={Scissors} />
            <QuickLinkCard href="/stock" label="Stock" descripcion="Productos y movimientos" icon={Package} />
            <QuickLinkCard href="/empleados" label="Empleados" descripcion="Alta, edición y comisiones" icon={UserCog} />
            <QuickLinkCard href="/servicios" label="Servicios" descripcion="Catálogo y precios" icon={Sparkles} />
            <QuickLinkCard href="/estadisticas" label="Estadísticas" descripcion="Resumen del mes" icon={ChartBar} />
            <QuickLinkCard href="/configuracion" label="Configuración" descripcion="Horarios, capacidad, comisión" icon={Settings2} />
          </div>
        </div>
      </div>
    );
  }

  // Vista de empleado
  const [
    { count: misTurnosHoy },
    { data: misTrabajosPendientes },
    { data: miComisionSemana },
    { data: movimientosEfectivoTodos },
  ] = await Promise.all([
    supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("profile_id", perfil.id)
      .gte("fecha_hora_inicio", hoyInicio.toISOString())
      .lte("fecha_hora_inicio", hoyFin.toISOString())
      .neq("estado", "CANCELADO"),

    supabase
      .from("works")
      .select("id")
      .eq("profile_id", perfil.id)
      .in("estado", ["TOMADO", "EN_CURSO", "FINALIZADO"]),

    supabase
      .from("employee_commissions")
      .select("monto")
      .eq("profile_id", perfil.id)
      .is("settlement_id", null),

    supabase
      .from("cash_movements")
      .select("monto, tipo")
      .eq("metodo", "EFECTIVO"),
  ]);

  let cajaFisica = 0;

  for (const movimiento of movimientosEfectivoTodos ?? []) {
    cajaFisica +=
      movimiento.tipo === "INGRESO"
        ? Number(movimiento.monto)
        : -Number(movimiento.monto);
  }

  const comisionPendiente = (miComisionSemana ?? []).reduce(
    (acc, c) => acc + Number(c.monto),
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#4A3428]">Dashboard</h1>
        <p className="text-sm text-[#9C8577]">Tu resumen de hoy.</p>
      </div>

      <AlertaTurnosSinTomar cantidad={sinTomar.cantidad} avisoMin={sinTomar.avisoMin} />

      <NotificacionesTurnos cancelaciones={cancelaciones} reprogramaciones={reprogramaciones} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/agenda">
          <StatCard
            label="Mis turnos hoy"
            value={String(misTurnosHoy ?? 0)}
            icon={CalendarCheck}
          />
        </Link>

        <Link href="/trabajos">
          <StatCard
            label="Mis trabajos en curso"
            value={String((misTrabajosPendientes ?? []).length)}
            icon={Scissors}
          />
        </Link>

        <Link href="/caja">
          <StatCard
            label="Caja física"
            value={formatearPesos(cajaFisica)}
            icon={Banknote}
          />
        </Link>

        <Link href="/liquidaciones">
          <StatCard
            label="Mi comisión sin liquidar"
            value={formatearPesos(comisionPendiente)}
            icon={HandCoins}
          />
        </Link>
      </div>

      <div>
        <h2 className="text-sm font-medium text-[#4A3428] mb-3">
          Accesos rápidos
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuickLinkCard
            href="/clientes"
            label="Clientes"
            descripcion="Buscar y editar clientes"
            icon={Users}
          />

          <QuickLinkCard
            href="/agenda"
            label="Turnos"
            descripcion="Ver y gestionar turnos"
            icon={CalendarDays}
          />

          <QuickLinkCard
            href="/presupuestos"
            label="Presupuestos"
            descripcion="Crear y consultar presupuestos"
            icon={FileSignature}
          />

          <QuickLinkCard
            href="/trabajos"
            label="Trabajos"
            descripcion="Gestionar trabajos"
            icon={Scissors}
          />

          <QuickLinkCard
            href="/stock"
            label="Stock"
            descripcion="Productos y movimientos"
            icon={Package}
          />

          <QuickLinkCard
            href="/caja"
            label="Caja"
            descripcion="Consultar y registrar movimientos"
            icon={Wallet}
          />

          <QuickLinkCard
            href="/cuenta-corriente"
            label="Cuenta corriente"
            descripcion="Consultar cuentas de clientes"
            icon={Landmark}
          />

          <QuickLinkCard
            href="/liquidaciones"
            label="Liquidaciones"
            descripcion="Consultar mis comisiones"
            icon={HandCoins}
          />

          <QuickLinkCard
            href="/documentos"
            label="Documentos"
            descripcion="Comprobantes y documentos"
            icon={FileText}
          />

          <QuickLinkCard
            href="/perfil"
            label="Mi perfil"
            descripcion="Mis datos y configuración"
            icon={CircleUser}
          />
        </div>
      </div>
    </div>
  );
}