import { createClient } from "@/lib/supabase/server";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { mostrarFechaHora } from "@/lib/dates";
import { UNIDAD } from "@/constants/labels";

const TIPO_LABEL: Record<string, string> = {
  ENTRADA: "Entrada",
  CONSUMO: "Consumo",
  AJUSTE: "Ajuste",
  DEVOLUCION: "Devolución",
};

export default async function MovimientosStockPage() {
  const supabase = await createClient();

  const { data: movimientos, error } = await supabase
    .from("stock_movements")
    .select("*, products(nombre, unidad)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-neutral-900">Historial de movimientos</h1>

      {error && <p className="text-sm text-red-600">No se pudieron cargar los movimientos.</p>}
      {!error && movimientos && movimientos.length === 0 && (
        <p className="text-sm text-neutral-500">Todavía no hay movimientos.</p>
      )}

      {!error && movimientos && movimientos.length > 0 && (
        <Table>
          <Thead>
            <Tr>
              <Th>Fecha</Th>
              <Th>Producto</Th>
              <Th>Tipo</Th>
              <Th>Cantidad</Th>
              <Th>Motivo</Th>
            </Tr>
          </Thead>
          <Tbody>
            {movimientos.map((m) => {
              const cantidad = Number(m.cantidad);
              const positivo = cantidad > 0;
              return (
                <Tr key={m.id}>
                  <Td>{mostrarFechaHora(m.created_at)}</Td>
                  <Td>{m.products?.nombre ?? "—"}</Td>
                  <Td>
                    <Badge variant={m.tipo === "CONSUMO" ? "neutral" : positivo ? "success" : "danger"}>
                      {TIPO_LABEL[m.tipo] ?? m.tipo}
                    </Badge>
                  </Td>
                  <Td className={positivo ? "text-green-700" : "text-red-700"}>
                    {positivo ? "+" : ""}
                    {cantidad} {m.products ? UNIDAD[m.products.unidad] : ""}
                  </Td>
                  <Td>{m.motivo ?? "—"}</Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      )}
    </div>
  );
}