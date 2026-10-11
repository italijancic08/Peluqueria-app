"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RotateCw } from "lucide-react";
import { reintentarEmailFallido } from "@/actions/monitorizacion";
import { cn } from "@/lib/utils";

export function ReenviarEmailButton({ id }: { id: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function reintentar() {
    setError(null);
    startTransition(async () => {
      const res = await reintentarEmailFallido(id);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={reintentar}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[#EDD9C4] bg-white px-3 py-1.5 text-xs font-medium text-[#6B4635] transition-colors hover:bg-[#FBF3EA] disabled:opacity-50"
      >
        <RotateCw className={cn("h-3.5 w-3.5", isPending && "animate-spin")} />
        {isPending ? "Reenviando..." : "Reintentar"}
      </button>
      {error && (
        <p className="max-w-[16rem] whitespace-normal break-words text-xs text-[#B1543A]">
          {error}
        </p>
      )}
    </div>
  );
}