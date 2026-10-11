"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buscarTurnoPorCodigo } from "@/actions/turnos-codigo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LARGO_CODIGO, normalizarCodigo } from "@/lib/validations/codigo-turno";

export function BuscarTurnoForm() {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [buscando, setBuscando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const limpio = normalizarCodigo(codigo);
    if (limpio.length !== LARGO_CODIGO) {
      setError(`El código tiene ${LARGO_CODIGO} caracteres.`);
      return;
    }

    setBuscando(true);
    const resultado = await buscarTurnoPorCodigo(limpio);

    if (!resultado.ok) {
      setBuscando(false);
      setError(resultado.error);
      return;
    }

    // Se mantiene "buscando" hasta que cargue la página del turno
    router.push(`/turnos/gestionar/${resultado.data.token}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-[#E8C9B8] bg-[#F7E9E2] px-3 py-2 text-sm text-[#B1543A]">
          {error}
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="codigo-turno" className="text-sm font-medium text-[#4A3428]">
          Código de turno
        </label>
        <Input
          id="codigo-turno"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.toUpperCase())}
          placeholder="Ej: K7M-4PX"
          maxLength={LARGO_CODIGO + 1}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          className="text-center font-mono text-lg font-semibold tracking-[0.2em]"
        />
        <p className="text-xs text-[#9C8577]">
          Lo recibiste al sacar tu turno. Con él podés ver, cancelar o cambiar el horario.
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={buscando}>
        {buscando ? "Buscando..." : "Buscar mi turno"}
      </Button>
    </form>
  );
}