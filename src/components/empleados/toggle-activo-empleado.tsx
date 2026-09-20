"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { alternarEmpleadoActivo } from "@/actions/employees";
import { Button } from "@/components/ui/button";

export function ToggleActivoEmpleado({ id, activo }: { id: string; activo: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function alternar() {
    setError(null);
    startTransition(async () => {
      const resultado = await alternarEmpleadoActivo(id, !activo);
      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="inline-block">
      {error && <p className="text-xs text-red-600">{error}</p>}
      <Button variant="ghost" onClick={alternar} disabled={isPending}>
        {activo ? "Desactivar" : "Activar"}
      </Button>
    </div>
  );
}