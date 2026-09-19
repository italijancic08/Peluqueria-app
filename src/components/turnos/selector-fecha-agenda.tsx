"use client";

import { useRouter } from "next/navigation";

export function SelectorFechaAgenda({ fecha }: { fecha: string }) {
  const router = useRouter();
  return (
    <input
      type="date"
      defaultValue={fecha}
      className="w-full max-w-xs rounded-md border border-neutral-300 px-3 py-2 text-sm"
      onChange={(e) => router.push(`/agenda?fecha=${e.target.value}`)}
    />
  );
}