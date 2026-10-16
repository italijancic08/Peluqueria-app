"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SelectorFecha } from "@/components/ui/selector-fecha";

export function SelectorFechaAgenda({ fecha }: { fecha: string }) {
  const router = useRouter();
  const [valor, setValor] = useState(fecha);
  const [fechaPrevia, setFechaPrevia] = useState(fecha);

  // Si la página llega con otra fecha (navegación), se actualiza el valor mostrado.
  if (fecha !== fechaPrevia) {
    setFechaPrevia(fecha);
    setValor(fecha);
  }

  function elegir(iso: string) {
    setValor(iso);
    router.push(`/agenda?fecha=${iso}`);
  }

  // Sin "min": en la agenda se pueden consultar días pasados.
  return <SelectorFecha className="w-full max-w-xs" value={valor} onChange={elegir} />;
}