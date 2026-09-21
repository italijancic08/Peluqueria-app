"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { actualizarMovimientoManual } from "@/actions/cash";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tr, Td } from "@/components/ui/table";
import { SelectorMedioPago } from "@/components/caja/selector-medio-pago";
import { formatearPesos } from "@/lib/format";
import { MEDIO_PAGO } from "@/constants/labels";
import type { CashMovement } from "@/types/models";

type Props = {
  movimiento: CashMovement & { works: { numero: number } | null };
};

export function FilaMovimiento({ movimiento: m }: Props) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [tipo, setTipo] = useState<"INGRESO" | "EGRESO">(m.tipo as "INGRESO" | "EGRESO");
  const [metodo, setMetodo] = useState<"EFECTIVO" | "TRANSFERENCIA" | "TARJETA_CREDITO" | "TARJETA_DEBITO">(
    m.metodo as "EFECTIVO" | "TRANSFERENCIA" | "TARJETA_CREDITO" | "TARJETA_DEBITO"
  );
  const [monto, setMonto] = useState(String(m.monto));
  const [descripcion, setDescripcion] = useState(m.descripcion ?? "");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const esEditable = !m.work_id;
  const esIngreso = m.tipo === "INGRESO";
  const dia = new Date(m.created_at).getDate();

  async function guardar() {
    setError(null);
    setEnviando(true);
    const resultado = await actualizarMovimientoManual(m.id, {
      tipo,
      metodo,
      monto: Number(monto),
      descripcion,
    });
    setEnviando(false);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }

    setEditando(false);
    router.refresh();
  }

  if (editando) {
    return (
      <Tr>
        <Td colSpan={6}>
          <div className="space-y-2 py-2">
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex flex-wrap gap-2 items-center">
              <select
                className="rounded-md border border-[#EDD9C4] px-2 py-1 text-sm"
                value={tipo}
                onChange={(e) => setTipo(e.target.value as "INGRESO" | "EGRESO")}
              >
                <option value="EGRESO">Egreso</option>
                <option value="INGRESO">Ingreso</option>
              </select>
              <SelectorMedioPago value={metodo} onChange={setMetodo} />
              <Input
                type="number"
                step="0.01"
                min="0"
                className="w-28"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
              />
              <Input
                className="flex-1 min-w-[150px]"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
              <Button onClick={guardar} disabled={enviando}>
                {enviando ? "Guardando..." : "Guardar"}
              </Button>
              <Button variant="ghost" onClick={() => setEditando(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </Td>
      </Tr>
    );
  }

  return (
    <Tr>
      <Td>{dia}</Td>
      <Td>
        <Badge variant={esIngreso ? "success" : "danger"}>{esIngreso ? "Ingreso" : "Egreso"}</Badge>
      </Td>
      <Td>{MEDIO_PAGO[m.metodo as keyof typeof MEDIO_PAGO]}</Td>
      <Td>{m.descripcion ?? "—"}</Td>
      <Td>{m.works ? `#${m.works.numero}` : "—"}</Td>
      <Td className={esIngreso ? "text-green-700 font-medium" : "text-red-700 font-medium"}>
        <div className="flex items-center justify-between gap-2">
          <span>
            {esIngreso ? "+" : "-"}
            {formatearPesos(Math.abs(Number(m.monto)))}
          </span>
          {esEditable && (
            <button
              type="button"
              onClick={() => setEditando(true)}
              className="text-xs text-[#6B4635] underline font-normal"
            >
              Editar
            </button>
          )}
        </div>
      </Td>
    </Tr>
  );
}