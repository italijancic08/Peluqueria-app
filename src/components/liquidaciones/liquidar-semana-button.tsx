"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { liquidarSemana } from "@/actions/commissions";
import { Button } from "@/components/ui/button";

type Props = {
  profileId: string;
  semanaInicio: string;
  semanaFin: string;
};

export function LiquidarSemanaButton({ profileId, semanaInicio, semanaFin }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function liquidar() {
    setError(null);
    startTransition(async () => {
      const resultado = await liquidarSemana(profileId, semanaInicio, semanaFin);
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
      <Button onClick={liquidar} disabled={isPending}>
        {isPending ? "Liquidando..." : "Liquidar esta semana"}
      </Button>
    </div>
  );
}