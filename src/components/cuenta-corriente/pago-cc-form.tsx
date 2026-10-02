"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registrarPagoCC } from "@/actions/account";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SelectorMedioPago, type MedioPagoValue } from "@/components/caja/selector-medio-pago";
import { formatearPesos } from "@/lib/format";

export function PagoCCForm({ clientId, saldo }: { clientId: string; saldo: number }) {
  const router = useRouter();
  const [metodo, setMetodo] = useState<MedioPagoValue>("EFECTIVO");
  const [monto, setMonto] = useState(saldo > 0 ? String(saldo) : "");
  const [descripcion, setDescripcion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (saldo <= 0) {
    return <p className="text-sm text-[#9C8577]">Este cliente no tiene saldo pendiente.</p>;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);

    const resultado = await registrarPagoCC({
      clientId,
      monto: Number(monto),
      metodo,
      descripcion,
    });
    setEnviando(false);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }

    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 max-w-sm">
      {error && <p className="text-xs text-red-600">{error}</p>}
      <p className="text-sm text-neutral-600">Deuda actual: {formatearPesos(saldo)}</p>
      <SelectorMedioPago value={metodo} onChange={setMetodo} />
      <Input
        type="number"
        step="0.01"
        min="0"
        max={saldo}
        value={monto}
        onChange={(e) => setMonto(e.target.value)}
      />
      <Input placeholder="Descripción (opcional)" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
      <Button type="submit" disabled={enviando}>
        {enviando ? "Registrando..." : "Registrar pago"}
      </Button>
    </form>
  );
}