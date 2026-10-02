import { Badge } from "@/components/ui/badge";
import { Tr, Td } from "@/components/ui/table";
import { formatearPesos } from "@/lib/format";
import { mostrarFecha } from "@/lib/dates";

type Movimiento = {
  id: string;
  tipo: string;
  monto: number;
  descripcion: string | null;
  created_at: string;
  works: { numero: number } | null;
};

export function FilaMovimientoCC({ m }: { m: Movimiento }) {
  const esDebito = m.tipo === "DEBITO";

  return (
    <Tr>
      <Td>{mostrarFecha(m.created_at)}</Td>
      <Td>
        <Badge variant={esDebito ? "danger" : "success"}>{esDebito ? "Cargo" : "Pago"}</Badge>
      </Td>
      <Td>{m.descripcion ?? "—"}</Td>
      <Td>{m.works ? `#${m.works.numero}` : "—"}</Td>
      <Td className={esDebito ? "text-red-600 font-medium" : "text-green-700 font-medium"}>
        {esDebito ? "+" : "-"}
        {formatearPesos(Math.abs(m.monto))}
      </Td>
    </Tr>
  );
}