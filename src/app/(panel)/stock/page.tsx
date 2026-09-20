import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { ToggleActivoProducto } from "@/components/stock/toggle-activo-producto";
import { UNIDAD } from "@/constants/labels";

export default async function StockPage() {
  const supabase = await createClient();

  const { data: productos, error } = await supabase
    .from("products")
    .select("*")
    .order("nombre", { ascending: true });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900">Stock</h1>
        <div className="flex gap-2">
          <Link href="/stock/movimientos" className="text-sm text-neutral-900 underline self-center">
            Ver historial
          </Link>
          <Link href="/stock/nuevo">
            <Button>Nuevo producto</Button>
          </Link>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">No se pudieron cargar los productos.</p>}
      {!error && productos && productos.length === 0 && (
        <p className="text-sm text-neutral-500">Todavía no hay productos cargados.</p>
      )}

      {!error && productos && productos.length > 0 && (
        <Table>
          <Thead>
            <Tr>
              <Th>Nombre</Th>
              <Th>Categoría</Th>
              <Th>Stock actual</Th>
              <Th>Estado</Th>
              <Th></Th>
            </Tr>
          </Thead>
          <Tbody>
            {productos.map((p) => {
              const bajoStock = Number(p.cantidad_actual) <= Number(p.stock_minimo);
              return (
                <Tr key={p.id}>
                  <Td>{p.nombre}</Td>
                  <Td>{p.categoria ?? "—"}</Td>
                  <Td className={bajoStock ? "text-red-600 font-medium" : ""}>
                    {Number(p.cantidad_actual)} {UNIDAD[p.unidad]}
                    {bajoStock && " (bajo)"}
                  </Td>
                  <Td>
                    <Badge variant={p.activo ? "success" : "neutral"}>
                      {p.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </Td>
                  <Td className="text-right space-x-2">
                    <Link href={`/stock/${p.id}/editar`} className="text-sm text-neutral-900 underline">
                      Editar
                    </Link>
                    <ToggleActivoProducto id={p.id} activo={p.activo} />
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