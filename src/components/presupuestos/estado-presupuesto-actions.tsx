"use client";

import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import { actualizarEstadoPresupuesto } from "@/actions/budgets";
import { Button } from "@/components/ui/button";

export function EstadoPresupuestoActions({ id }: { id: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function decidir(estado: "ACEPTADO" | "RECHAZADO") {
    setError(null);
    startTransition(async () => {
      const resultado = await actualizarEstadoPresupuesto(id, estado);
      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button onClick={() => decidir("ACEPTADO")} disabled={isPending}>
          Aceptar
        </Button>
        <Button variant="danger" onClick={() => decidir("RECHAZADO")} disabled={isPending}>
          Rechazar
        </Button>
      </div>
    </div>
  );
}