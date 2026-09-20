"use client";

import { useRouter } from "next/navigation";

export function SelectorMesCaja({ mes }: { mes: string }) {
  const router = useRouter();
  return (
    <input
      type="month"
      defaultValue={mes}
      className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
      onChange={(e) => router.push(`/caja?mes=${e.target.value}`)}
    />
  );
}