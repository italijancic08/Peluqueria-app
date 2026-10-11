"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { formatearCodigo } from "@/lib/validations/codigo-turno";

type Props = {
  codigo: string;
  descripcion?: string;
};

export function CodigoTurno({
  codigo,
  descripcion = "Con este código podés cancelar o cambiar tu turno desde “Gestionar turno”.",
}: Props) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // si el navegador no permite copiar, el código sigue a la vista
    }
  }

  return (
    <div className="space-y-2 rounded-xl border border-[#EDD9C4] bg-[#FBF3EA] p-4 text-center">
      <p className="text-xs text-[#9C8577]">Código de turno</p>
      <p className="font-mono text-3xl font-semibold tracking-[0.25em] text-[#4A3428]">
        {formatearCodigo(codigo)}
      </p>
      <p className="text-xs text-[#9C8577]">{descripcion}</p>
      <button
        type="button"
        onClick={copiar}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#6B4635] hover:underline"
      >
        {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copiado ? "Copiado" : "Copiar código"}
      </button>
    </div>
  );
}