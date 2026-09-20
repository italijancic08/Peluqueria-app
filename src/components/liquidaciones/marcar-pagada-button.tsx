"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { marcarLiquidacionPagada } from "@/actions/commissions";
import { Button } from "@/components/ui/button";

export function MarcarPagadaButton({ settlementId }: { settlementId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function marcar() {
    startTransition(async () => {
      await marcarLiquidacionPagada(settlementId);
      router.refresh();
    });
  }

  return (
    <Button variant="secondary" onClick={marcar} disabled={isPending}>
      {isPending ? "Marcando..." : "Marcar pagada"}
    </Button>
  );
}