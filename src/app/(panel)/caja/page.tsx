import Link from "next/link";
import { Banknote, TrendingUp, TrendingDown, ArrowRightLeft, CreditCard, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/guards";
import { Table, Thead, Tbody, Tr, Th } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { SelectorMesCaja } from "@/components/caja/selector-mes-caja";
import { MovimientoManualForm } from "@/components/caja/movimiento-manual-form";
import { FilaMovimiento } from "@/components/caja/fila-movimiento";
import { CerrarMesButton } from "@/components/caja/cerrar-mes-button";
import { formatearPesos } from "@/lib/format";
import { mostrarFechaHora } from "@/lib/dates";
import {
  esMesValido,
  etiquetaMes,
  limitesDelMes,
  mesActualISO,
  mesSiguiente,
  resumirMovimientos,
} from "@/lib/calculations/caja";

export default async function CajaPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const perfil = await requireAuth();
  const { mes } = await searchParams;

  const mesActual = mesActualISO();
  const mesConsulta = mes && esMesValido(mes) ? mes : mesActual;
  const periodo = `${mesConsulta}-01`;
  const { desde, hasta } = limitesDelMes(mesConsulta);

  const supabase = await createClient();

  const [{ data: movimientos, error }, { data: cierre }, { data: ultimoCierre }] =
    await Promise.all([
      supabase
        .from("cash_movements")
        .select("*, works(numero)")
        .gte("created_at", desde)
        .lt("created_at", hasta)
        .order("created_at", { ascending: true }),
      supabase.from("cash_closures").select("*").eq("periodo", periodo).maybeSingle(),
      supabase
        .from("cash_closures")
        .select("periodo")
        .order("periodo", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  let cajaInicial = 0;
  if (cierre) {
    cajaInicial = Number(cierre.saldo_inicial_efectivo);
  } else {
    const { data } = await supabase.rpc("caja_fisica_inicial", { p_periodo: periodo });
    cajaInicial = Number(data ?? 0);
  }

  const resumen = resumirMovimientos(movimientos ?? []);
  const cajaFisicaFinal = cajaInicial + resumen.efectivo;

  const esAdmin = perfil.rol === "ADMIN";
  const esMesActual = mesConsulta === mesActual;
  const puedeEditar = esAdmin && !cierre;
  const puedeCerrar =
    esAdmin &&
    !cierre &&
    mesConsulta < mesActual &&
    (!ultimoCierre || periodo > ultimoCierre.periodo);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[#4A3428]">Caja</h1>
          <p className="text-sm text-[#9C8577]">Caja de {etiquetaMes(mesConsulta)}</p>
        </div>
        {cierre ? (
          <Badge variant="neutral">Mes cerrado</Badge>
        ) : (
          <Badge variant="success">Mes abierto</Badge>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SelectorMesCaja mes={mesConsulta} />
        <div className="flex items-center gap-4">
          <Link href="/caja/cierres" className="text-sm text-[#6B4635] underline">
            Historial de cierres
          </Link>
          <a href={`/api/export/caja?mes=${mesConsulta}`} className="text-sm text-[#6B4635] underline">
            Descargar Excel
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Caja física inicial" value={formatearPesos(cajaInicial)} icon={Banknote} />
        <StatCard label="Ingresos (todos los medios)" value={formatearPesos(resumen.ingresos)} icon={TrendingUp} />
        <StatCard
          label="Egresos (todos los medios)"
          value={formatearPesos(resumen.egresos)}
          icon={TrendingDown}
          tono={resumen.egresos > 0 ? "alerta" : "neutral"}
        />
        <StatCard
          label={cierre ? "Caja física final (cerrada)" : "Caja física actual"}
          value={formatearPesos(cajaFisicaFinal)}
          icon={Banknote}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatCard
          label="Transferencias del mes (no migra)"
          value={formatearPesos(resumen.transferencias)}
          icon={ArrowRightLeft}
        />
        <StatCard
          label="Tarjetas del mes (no migra)"
          value={formatearPesos(resumen.tarjetas)}
          icon={CreditCard}
        />
      </div>

      {cierre && (
        <div className="flex items-start gap-3 rounded-xl border border-[#EDD9C4] bg-white p-4">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[#9C8577]" />
          <p className="text-sm text-[#4A3428]">
            Este mes se cerró el {mostrarFechaHora(cierre.closed_at)}. Los movimientos ya no se
            pueden modificar: cualquier corrección se registra como un movimiento nuevo en el mes
            abierto. La caja física final ({formatearPesos(cierre.caja_fisica_final)}) pasó como
            caja inicial de {etiquetaMes(mesSiguiente(mesConsulta)).toLowerCase()}.
          </p>
        </div>
      )}

      {puedeCerrar && (
        <CerrarMesButton
          mes={mesConsulta}
          etiqueta={etiquetaMes(mesConsulta)}
          etiquetaSiguiente={etiquetaMes(mesSiguiente(mesConsulta))}
          cajaFinal={formatearPesos(cajaFisicaFinal)}
        />
      )}

      {esAdmin && esMesActual && !cierre && (
        <p className="text-xs text-[#9C8577]">
          Este mes se podrá cerrar cuando termine.
        </p>
      )}

      {esMesActual ? (
        <MovimientoManualForm />
      ) : (
        <p className="text-xs text-[#9C8577]">
          Los movimientos manuales se registran siempre en el mes actual.
        </p>
      )}

      {error && <p className="text-sm text-[#B1543A]">No se pudieron cargar los movimientos.</p>}
      {!error && movimientos && movimientos.length === 0 && (
        <p className="text-sm text-[#9C8577]">No hay movimientos ese mes.</p>
      )}

      {!error && movimientos && movimientos.length > 0 && (
        <Table>
          <Thead>
            <Tr>
              <Th>Día</Th>
              <Th>Tipo</Th>
              <Th>Forma</Th>
              <Th>Concepto</Th>
              <Th>Trabajo</Th>
              <Th>Monto</Th>
            </Tr>
          </Thead>
          <Tbody>
            {movimientos.map((m) => (
              <FilaMovimiento key={m.id} movimiento={m as any} puedeEditar={puedeEditar} />
            ))}
          </Tbody>
        </Table>
      )}
    </div>
  );
}