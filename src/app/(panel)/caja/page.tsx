import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SelectorMesCaja } from "@/components/caja/selector-mes-caja";
import { MovimientoManualForm } from "@/components/caja/movimiento-manual-form";
import { formatearPesos } from "@/lib/format";
import { MEDIO_PAGO } from "@/constants/labels";

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function primerYUltimoDia(mesISO: string) {
  const [anio, mes] = mesISO.split("-").map(Number);
  const primerDia = `${mesISO}-01`;
  const ultimoDiaNum = new Date(anio, mes, 0).getDate();
  const ultimoDia = `${mesISO}-${String(ultimoDiaNum).padStart(2, "0")}`;
  return { primerDia, ultimoDia };
}

export default async function CajaPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes } = await searchParams;
  const mesConsulta = mes ?? new Date().toISOString().slice(0, 7);
  const { primerDia, ultimoDia } = primerYUltimoDia(mesConsulta);

  const supabase = await createClient();
  const { data: movimientos, error } = await supabase
    .from("cash_movements")
    .select("*, works(numero)")
    .gte("created_at", `${primerDia}T00:00:00`)
    .lt("created_at", `${ultimoDia}T23:59:59`)
    .order("created_at", { ascending: true });

  let ingresosTotal = 0;
  let egresosTotal = 0;
  let cajaFisica = 0;

  for (const m of movimientos ?? []) {
    const monto = Number(m.monto);
    if (m.tipo === "INGRESO") {
      ingresosTotal += monto;
      if (m.metodo === "EFECTIVO") cajaFisica += monto;
    } else {
      egresosTotal += monto;
      if (m.metodo === "EFECTIVO") cajaFisica -= monto;
    }
  }

  const [anio, mesNum] = mesConsulta.split("-").map(Number);
  const etiquetaMes = `${MESES[mesNum - 1]} de ${anio}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Caja</h1>
        <p className="text-sm text-neutral-500">
          Caja de {etiquetaMes.charAt(0).toUpperCase() + etiquetaMes.slice(1)}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <SelectorMesCaja mes={mesConsulta} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-md border border-green-200 bg-green-50 p-3">
          <p className="text-xs text-green-700">Ingresos (todas las formas)</p>
          <p className="text-lg font-semibold text-green-800">{formatearPesos(ingresosTotal)}</p>
        </div>
        <div className="rounded-md border border-red-200 bg-red-50 p-3">
          <p className="text-xs text-red-700">Egresos (todas las formas)</p>
          <p className="text-lg font-semibold text-red-700">{formatearPesos(egresosTotal)}</p>
        </div>
        <div className="rounded-md border border-neutral-200 bg-white p-3">
          <p className="text-xs text-neutral-500">Caja física (solo efectivo)</p>
          <p className="text-lg font-semibold text-neutral-900">{formatearPesos(cajaFisica)}</p>
        </div>
      </div>

      <MovimientoManualForm />

      {error && <p className="text-sm text-red-600">No se pudieron cargar los movimientos.</p>}
      {!error && movimientos && movimientos.length === 0 && (
        <p className="text-sm text-neutral-500">No hay movimientos ese mes.</p>
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
            {movimientos.map((m) => {
              const dia = new Date(m.created_at).getDate();
              const esIngreso = m.tipo === "INGRESO";
              return (
                <Tr key={m.id}>
                  <Td>{dia}</Td>
                  <Td>
                    <Badge variant={esIngreso ? "success" : "danger"}>
                      {esIngreso ? "Ingreso" : "Egreso"}
                    </Badge>
                  </Td>
                  <Td>{MEDIO_PAGO[m.metodo as keyof typeof MEDIO_PAGO]}</Td>
                  <Td>{m.descripcion ?? "—"}</Td>
                  <Td>
                    {m.works ? (
                      <Link
                        href={`/trabajos/${m.work_id}`}
                        className="text-neutral-900 underline"
                      >
                        #{m.works.numero}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </Td>
                  <Td className={esIngreso ? "text-green-700 font-medium" : "text-red-700 font-medium"}>
                    {esIngreso ? "+" : "-"}
                    {formatearPesos(monto_abs(m.monto))}
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

function monto_abs(monto: number) {
  return Math.abs(Number(monto));
}