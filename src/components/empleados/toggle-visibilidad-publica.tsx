"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { actualizarVisibilidadPublica } from "@/actions/profile";

export function ToggleVisibilidadPublica({ id, visible }: { id: string; visible: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [checked, setChecked] = useState(visible);

  function alternar() {
    const nuevo = !checked;
    setChecked(nuevo);
    startTransition(async () => {
      await actualizarVisibilidadPublica(id, nuevo);
      router.refresh();
    });
  }

  return (
    <label className="flex items-center gap-2 text-sm text-[#4A3428] max-w-sm">
      <input type="checkbox" checked={checked} onChange={alternar} disabled={isPending} />
      Mostrar en la sección "Nuestro equipo" de la reserva pública
    </label>
  );
}