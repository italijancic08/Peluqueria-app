"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { cerrarMes } from "@/actions/cash";
import { Button } from "@/components/ui/button";

type Props = {
  mes: string;
  etiqueta: string;
  etiquetaSiguiente: string;
  cajaFinal: string;
};

export function CerrarMesButton({ mes, etiqueta, etiquetaSiguiente, cajaFinal }: Props) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function confirmar() {
    setError(null);
    setEnviando(true);
    const resultado = await cerrarMes(mes);
    setEnviando(false);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }

    setAbierto(false);
    router.refresh();
  }

  if (!abierto) {
    return (
      <Button variant="secondary" onClick={() => setAbierto(true)}>
        <Lock className="mr-2 h-4 w-4" />
        Cerrar {etiqueta.toLowerCase()}
      </Button>
    );
  }

  return (
    <div className="max-w-lg space-y-3 rounded-xl border border-[#EDD9C4] bg-white p-4">
      <p className="text-sm font-medium text-[#4A3428]">
        ¿Cerrar la caja de {etiqueta.toLowerCase()}?
      </p>
      <p className="text-sm text-[#9C8577]">
        Se guardará el resumen del mes y la caja física final de{" "}
        <span className="font-semibold text-[#4A3428]">{cajaFinal}</span> pasará como caja inicial de{" "}
        {etiquetaSiguiente.toLowerCase()}. Solo se traslada el efectivo: las transferencias y
        tarjetas no. Después de cerrar no se podrán modificar los movimientos de este mes.
      </p>

      {error && <p className="text-sm text-[#B1543A]">{error}</p>}

      <div className="flex gap-2">
        <Button onClick={confirmar} disabled={enviando}>
          {enviando ? "Cerrando..." : "Confirmar cierre"}
        </Button>
        <Button variant="secondary" onClick={() => setAbierto(false)} disabled={enviando}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}