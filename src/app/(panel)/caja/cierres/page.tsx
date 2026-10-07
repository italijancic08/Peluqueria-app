import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/guards";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { formatearPesos } from "@/lib/format";
import { mostrarFechaHora } from "@/lib/dates";
import { etiquetaMes } from "@/lib/calculations/caja";

export default async function CierresCajaPage() {
  await requireAuth();

  const supabase = await createClient();
  const { data: cierres, error } = await supabase
    .from("cash_closures")
    .select("*, profiles(nombre, apellido)")
    .order("periodo", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[#4A3428]">Cierres de caja</h1>
          <p className="text-sm text-[#9C8577]">
            Historial mensual. Solo el efectivo pasa como caja inicial del mes siguiente.
          </p>
        </div>
        <Link href="/caja" className="text-sm text-[#6B4635] underline">
          Volver a caja
        </Link>
      </div>

      {error && <p className="text-sm text-[#B1543A]">No se pudo cargar el historial.</p>}
      {!error && cierres && cierres.length === 0 && (
        <p className="text-sm text-[#9C8577]">Todavía no se cerró ningún mes.</p>
      )}

      {!error && cierres && cierres.length > 0 && (
        <Table>
          <Thead>
            <Tr>
              <Th>Mes</Th>
              <Th>Caja inicial</Th>
              <Th>Ingresos</Th>
              <Th>Egresos</Th>
              <Th>Efectivo</Th>
              <Th>Transferencias</Th>
              <Th>Tarjetas</Th>
              <Th>Caja final</Th>
              <Th>Cerrado</Th>
            </Tr>
          </Thead>
          <Tbody>
            {cierres.map((c) => {
              const autor = (c as any).profiles as { nombre: string; apellido: string } | null;
              return (
                <Tr key={c.id}>
                  <Td className="font-medium">
                    <Link href={`/caja?mes=${c.periodo.slice(0, 7)}`} className="underline">
                      {etiquetaMes(c.periodo.slice(0, 7))}
                    </Link>
                  </Td>
                  <Td>{formatearPesos(c.saldo_inicial_efectivo)}</Td>
                  <Td>{formatearPesos(c.total_ingresos)}</Td>
                  <Td>{formatearPesos(c.total_egresos)}</Td>
                  <Td>{formatearPesos(c.total_efectivo)}</Td>
                  <Td>{formatearPesos(c.total_transferencias)}</Td>
                  <Td>{formatearPesos(c.total_tarjetas)}</Td>
                  <Td className="font-semibold">{formatearPesos(c.caja_fisica_final)}</Td>
                  <Td>
                    <span className="block">{mostrarFechaHora(c.closed_at)}</span>
                    <span className="text-xs text-[#9C8577]">
                      {autor ? `${autor.nombre} ${autor.apellido}` : "—"}
                    </span>
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