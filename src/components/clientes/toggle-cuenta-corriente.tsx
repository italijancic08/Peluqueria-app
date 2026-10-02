"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { alternarCuentaCorriente } from "@/actions/account";

export function ToggleCuentaCorriente({ clientId, habilitada }: { clientId: string; habilitada: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [checked, setChecked] = useState(habilitada);

  function alternar() {
    const nuevo = !checked;
    setChecked(nuevo);
    startTransition(async () => {
      await alternarCuentaCorriente(clientId, nuevo);
      router.refresh();
    });
  }

  return (
    <label className="flex items-center gap-2 text-sm text-neutral-700">
      <input type="checkbox" checked={checked} onChange={alternar} disabled={isPending} />
      Cuenta corriente habilitada
    </label>
  );
}