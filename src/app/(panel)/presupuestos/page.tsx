import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { formatearPesos } from "@/lib/format";
import { mostrarFecha } from "@/lib/dates";
import { ESTADO_PRESUPUESTO } from "@/constants/labels";

export default async function PresupuestosPage() {
  const supabase = await createClient();

  const { data: presupuestos, error } = await supabase
    .from("budgets")
    .select("*, clients(nombre, apellido)")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900">Presupuestos</h1>
        <Link href="/presupuestos/nuevo">
          <Button>Nuevo presupuesto</Button>
        </Link>
      </div>

      {error && <p className="text-sm text-red-600">No se pudieron cargar los presupuestos.</p>}

      {!error && presupuestos && presupuestos.length === 0 && (
        <p className="text-sm text-neutral-500">Todavía no hay presupuestos cargados.</p>
      )}

      {!error && presupuestos && presupuestos.length > 0 && (
        <Table>
          <Thead>
            <Tr>
              <Th>N°</Th>
              <Th>Cliente</Th>
              <Th>Fecha</Th>
              <Th>Total</Th>
              <Th>Estado</Th>
              <Th></Th>
            </Tr>
          </Thead>
          <Tbody>
            {presupuestos.map((p) => (
              <Tr key={p.id}>
                <Td>#{p.numero}</Td>
                <Td>
                  {p.clients?.apellido}, {p.clients?.nombre}
                </Td>
                <Td>{mostrarFecha(p.created_at)}</Td>
                <Td>{formatearPesos(p.total)}</Td>
                <Td>
                  <Badge
                    variant={
                      p.estado === "ACEPTADO"
                        ? "success"
                        : p.estado === "RECHAZADO"
                        ? "danger"
                        : "neutral"
                    }
                  >
                    {ESTADO_PRESUPUESTO[p.estado as keyof typeof ESTADO_PRESUPUESTO]}
                  </Badge>
                </Td>
                <Td className="text-right">
                  <Link
                    href={`/presupuestos/${p.id}`}
                    className="text-sm text-neutral-900 underline"
                  >
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