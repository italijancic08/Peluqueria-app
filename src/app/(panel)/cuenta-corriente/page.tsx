import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { formatearPesos } from "@/lib/format";

export default async function CuentaCorrientePage() {
  const supabase = await createClient();

  const { data: clientes } = await supabase
    .from("clients")
    .select("id, nombre, apellido")
    .eq("cuenta_corriente_habilitada", true)
    .order("apellido");

  const ids = (clientes ?? []).map((c) => c.id);
  const saldos = new Map<string, number>();

  if (ids.length > 0) {
    const { data: movimientos } = await supabase
      .from("account_movements")
      .select("client_id, tipo, monto")
      .in("client_id", ids);

    for (const m of movimientos ?? []) {
      const signo = m.tipo === "DEBITO" ? 1 : -1;
      const actual = saldos.get(m.client_id) ?? 0;
      saldos.set(m.client_id, actual + signo * Number(m.monto));
    }
  }

  const filas = (clientes ?? [])
    .map((c) => ({ id: c.id, nombre: c.nombre, apellido: c.apellido, saldo: saldos.get(c.id) ?? 0 }))
    .sort((a, b) => b.saldo - a.saldo);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-[#4A3428]">Cuenta corriente</h1>
        <p className="text-sm text-[#9C8577]">Clientes con cuenta corriente habilitada.</p>
      </div>

      {filas.length === 0 && (
        <p className="text-sm text-[#9C8577]">
          Todavía no hay clientes con cuenta corriente habilitada. Podés activarla desde la ficha de
          cada cliente.
        </p>
      )}

      {filas.length > 0 && (
        <Table>
          <Thead>
            <Tr>
              <Th>Cliente</Th>
              <Th>Saldo</Th>
              <Th></Th>
            </Tr>
          </Thead>
          <Tbody>
            {filas.map((c) => (
              <Tr key={c.id}>
                <Td>
                  {c.apellido}, {c.nombre}
                </Td>
                <Td className={c.saldo > 0 ? "text-red-600 font-medium" : "text-neutral-500"}>
                  {formatearPesos(c.saldo)}
                </Td>
                <Td className="text-right">
                  <Link href={`/cuenta-corriente/${c.id}`} className="text-sm text-[#6B4635] underline">
                    Ver
                  </Link>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </div>
  );
}