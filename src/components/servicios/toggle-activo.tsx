"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { alternarServicioActivo } from "@/actions/services";
import { Button } from "@/components/ui/button";

export function ToggleActivo({ id, activo }: { id: string; activo: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function alternar() {
    startTransition(async () => {
      await alternarServicioActivo(id, !activo);
      router.refresh();
    });
  }

  return (
    <Button variant="ghost" onClick={alternar} disabled={isPending}>
      {activo ? "Desactivar" : "Activar"}
    </Button>
  );
}