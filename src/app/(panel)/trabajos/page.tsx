import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/guards";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatearPesos } from "@/lib/format";
import { ESTADO_TRABAJO } from "@/constants/labels";

export default async function TrabajosPage() {
  const perfil = await requireAuth();
  const supabase = await createClient();

  let query = supabase
    .from("works")
    .select("*, clients(nombre, apellido)")
    .neq("estado", "DISPONIBLE")
    .neq("estado", "CANCELADO")
    .order("created_at", { ascending: false });

  if (perfil.rol !== "ADMIN") {
    query = query.eq("profile_id", perfil.id);
  }

  const { data: trabajos, error } = await query;

  // Para los trabajos finalizados, calculamos si tienen pago parcial.
  const idsFinalizados = (trabajos ?? []).filter((t) => t.estado === "FINALIZADO").map((t) => t.id);
  const pagadoPorTrabajo = new Map<string, number>();

  if (idsFinalizados.length > 0) {
    const { data: pagos } = await supabase
      .from("payments")
      .select("work_id, monto")
      .in("work_id", idsFinalizados);

    for (const p of pagos ?? []) {
      pagadoPorTrabajo.set(p.work_id, (pagadoPorTrabajo.get(p.work_id) ?? 0) + Number(p.monto));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900">
          {perfil.rol === "ADMIN" ? "Trabajos" : "Mis trabajos"}
        </h1>
        <Link href="/trabajos/disponibles" className="text-sm text-neutral-900 underline">
          Ver disponibles
        </Link>
      </div>

      {error && <p className="text-sm text-red-600">No se pudieron cargar los trabajos.</p>}
      {!error && trabajos && trabajos.length === 0 && (
        <p className="text-sm text-neutral-500">No hay trabajos todavía.</p>
      )}

      {!error && trabajos && trabajos.length > 0 && (
        <Table>
          <Thead>
            <Tr>
              <Th>N°</Th>
              <Th>Cliente</Th>
              <Th>Total</Th>
              <Th>Estado</Th>
              <Th></Th>
            </Tr>
          </Thead>
          <Tbody>
            {trabajos.map((t) => {
              const pagado = pagadoPorTrabajo.get(t.id) ?? 0;
              const esDeudaParcial = t.estado === "FINALIZADO" && pagado > 0 && pagado < Number(t.total);

              return (
                <Tr key={t.id}>
                  <Td>#{t.numero}</Td>
                  <Td>
                    {t.clients?.apellido}, {t.clients?.nombre}
                  </Td>
                  <Td>{formatearPesos(t.total)}</Td>
                  <Td>
                    <Badge
                      variant={
                        t.estado === "COBRADO" ? "success" : esDeudaParcial ? "danger" : "neutral"
                      }
                    >
                      {esDeudaParcial
                        ? "Deuda parcial"
                        : ESTADO_TRABAJO[t.estado as keyof typeof ESTADO_TRABAJO]}
                    </Badge>
                  </Td>
                  <Td className="text-right">
                    <Link href={`/trabajos/${t.id}`} className="text-sm text-neutral-900 underline">
                      Ver
                    </Link>
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