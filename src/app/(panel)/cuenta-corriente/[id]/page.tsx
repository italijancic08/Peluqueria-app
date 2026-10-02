import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Table, Thead, Tbody, Tr, Th } from "@/components/ui/table";
import { FilaMovimientoCC } from "@/components/cuenta-corriente/fila-movimiento-cc";
import { MovimientoCCManualForm } from "@/components/cuenta-corriente/movimiento-cc-manual-form";
import { PagoCCForm } from "@/components/cuenta-corriente/pago-cc-form";
import { formatearPesos } from "@/lib/format";

export default async function CuentaCorrienteClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: cliente } = await supabase.from("clients").select("*").eq("id", id).single();

  if (!cliente || !cliente.cuenta_corriente_habilitada) notFound();

  const { data: movimientos } = await supabase
    .from("account_movements")
    .select("*, works(numero)")
    .eq("client_id", id)
    .order("created_at", { ascending: false });

  const saldo = (movimientos ?? []).reduce(
    (acc, m) => acc + (m.tipo === "DEBITO" ? Number(m.monto) : -Number(m.monto)),
    0
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">
          Cuenta corriente — {cliente.apellido}, {cliente.nombre}
        </h1>
        <p className={`text-sm ${saldo > 0 ? "text-red-600 font-medium" : "text-neutral-500"}`}>
          Saldo: {formatearPesos(saldo)}
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        <MovimientoCCManualForm clientId={id} />
      </div>

      <div>
        <h2 className="text-sm font-medium text-neutral-700 mb-2">Registrar pago</h2>
        <PagoCCForm clientId={id} saldo={saldo} />
      </div>

      <div>
        <h2 className="text-sm font-medium text-neutral-700 mb-2">Movimientos</h2>
        {(!movimientos || movimientos.length === 0) && (
          <p className="text-sm text-neutral-500">Todavía no hay movimientos.</p>
        )}
        {movimientos && movimientos.length > 0 && (
          <Table>
            <Thead>
              <Tr>
                <Th>Fecha</Th>
                <Th>Tipo</Th>
                <Th>Descripción</Th>
                <Th>Trabajo</Th>
                <Th>Monto</Th>
              </Tr>
            </Thead>
            <Tbody>
              {movimientos.map((m) => (
                <FilaMovimientoCC key={m.id} m={m as any} />
              ))}
            </Tbody>
          </Table>
        )}
      </div>
    </div>
  );
}