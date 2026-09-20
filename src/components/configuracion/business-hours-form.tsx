"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { actualizarHorarios } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { DIAS_SEMANA } from "@/constants/labels";
import type { BusinessHours } from "@/types/models";

type Props = { horarios: BusinessHours[] };

export function BusinessHoursForm({ horarios: horariosIniciales }: Props) {
  const router = useRouter();
  const [horarios, setHorarios] = useState(
    horariosIniciales
      .slice()
      .sort((a, b) => a.dia_semana - b.dia_semana)
      .map((h) => ({
        id: h.id,
        dia_semana: h.dia_semana,
        activo: h.activo,
        hora_apertura: h.hora_apertura.slice(0, 5),
        hora_cierre: h.hora_cierre.slice(0, 5),
      }))
  );
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function actualizarDia(index: number, campo: string, valor: string | boolean) {
    setHorarios(horarios.map((h, i) => (i === index ? { ...h, [campo]: valor } : h)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMensaje(null);
    setEnviando(true);

    const resultado = await actualizarHorarios({
      horarios: horarios.map((h) => ({
        id: h.id,
        dia_semana: h.dia_semana,
        activo: h.activo,
        hora_apertura: `${h.hora_apertura}:00`,
        hora_cierre: `${h.hora_cierre}:00`,
      })),
    });
    setEnviando(false);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }

    setMensaje("Horarios guardados.");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      {mensaje && <p className="text-sm text-green-700">{mensaje}</p>}

      <div className="space-y-2">
        {horarios.map((h, index) => (
          <div
            key={h.id}
            className="flex items-center gap-3 rounded-md border border-neutral-200 bg-white px-3 py-2"
          >
            <label className="flex items-center gap-2 w-28 text-sm text-neutral-700 shrink-0">
              <input
                type="checkbox"
                checked={h.activo}
                onChange={(e) => actualizarDia(index, "activo", e.target.checked)}
              />
              {DIAS_SEMANA[h.dia_semana]}
            </label>
            <input
              type="time"
              className="rounded-md border border-neutral-300 px-2 py-1 text-sm disabled:opacity-40"
              value={h.hora_apertura}
              disabled={!h.activo}
              onChange={(e) => actualizarDia(index, "hora_apertura", e.target.value)}
            />
            <span className="text-neutral-400 text-sm">a</span>
            <input
              type="time"
              className="rounded-md border border-neutral-300 px-2 py-1 text-sm disabled:opacity-40"
              value={h.hora_cierre}
              disabled={!h.activo}
              onChange={(e) => actualizarDia(index, "hora_cierre", e.target.value)}
            />
          </div>
        ))}
      </div>

      <Button type="submit" disabled={enviando}>
        {enviando ? "Guardando..." : "Guardar horarios"}
      </Button>
    </form>
  );
}