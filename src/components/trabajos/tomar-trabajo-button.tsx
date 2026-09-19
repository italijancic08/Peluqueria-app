"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { tomarTrabajo } from "@/actions/works";
import { Button } from "@/components/ui/button";

export function TomarTrabajoButton({ id }: { id: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function tomar() {
    setError(null);
    startTransition(async () => {
      const resultado = await tomarTrabajo(id);
      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }
      router.push(`/trabajos/${id}`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-1">
      {error && <p className="text-xs text-red-600">{error}</p>}
      <Button onClick={tomar} disabled={isPending}>
        {isPending ? "Tomando..." : "Tomar trabajo"}
      </Button>
    </div>
  );
}