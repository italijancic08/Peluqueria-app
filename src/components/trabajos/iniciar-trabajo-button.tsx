"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { iniciarTrabajo } from "@/actions/works";
import { Button } from "@/components/ui/button";

export function IniciarTrabajoButton({ id }: { id: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function iniciar() {
    setError(null);
    startTransition(async () => {
      const resultado = await iniciarTrabajo(id);
      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-1">
      {error && <p className="text-xs text-red-600">{error}</p>}
      <Button onClick={iniciar} disabled={isPending}>
        {isPending ? "Iniciando..." : "El cliente llegó — iniciar trabajo"}
      </Button>
    </div>
  );
}