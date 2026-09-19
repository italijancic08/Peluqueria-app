"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { cancelarTurno } from "@/actions/appointments";
import { Button } from "@/components/ui/button";

export function CancelarTurnoButton({ id }: { id: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function cancelar() {
    if (!confirm("¿Cancelar este turno?")) return;
    startTransition(async () => {
      await cancelarTurno(id);
      router.refresh();
    });
  }

  return (
    <Button variant="ghost" onClick={cancelar} disabled={isPending}>
      Cancelar
    </Button>
  );
}