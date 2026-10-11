"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { actualizarHorarios } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { DIAS_SEMANA } from "@/constants/labels";
import type { BusinessHours } from "@/types/models";

type Props = { horarios: BusinessHours[] };

// En la base el domingo es 0; en pantalla se muestra de lunes a domingo
const ordenDia = (dia: number) => (dia + 6) % 7;
const recortar = (hora: string | null) => (hora ? hora.slice(0, 5) : "");
const completar = (hora: string) => (hora ? `${hora}:00` : null);

const claseHora =
  "rounded-md border border-neutral-300 px-2 py-1 text-sm disabled:opacity-40";

export function BusinessHoursForm({ horarios: horariosIniciales }: Props) {
  const router = useRouter();
  const [horarios, setHorarios] = useState(
    horariosIniciales
      .slice()
      .sort((a, b) => ordenDia(a.dia_semana) - ordenDia(b.dia_semana))
      .map((h) => ({
        id: h.id,
        dia_semana: h.dia_semana,
        activo: h.activo,
        hora_apertura: recortar(h.hora_apertura),
        hora_cierre: recortar(h.hora_cierre),
        hora_apertura_2: recortar(h.hora_apertura_2),
        hora_cierre_2: recortar(h.hora_cierre_2),
      }))
  );
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function actualizarDia(index: number, campo: string, valor: string | boolean) {
    setHorarios(horarios.map((h, i) => (i === index ? { ...h, [campo]: valor } : h)));
  }

  function quitarTarde(index: number) {
    setHorarios(
      horarios.map((h, i) =>
        i === index ? { ...h, hora_apertura_2: "", hora_cierre_2: "" } : h
      )
    );
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
        hora_apertura_2: completar(h.hora_apertura_2),
        hora_cierre_2: completar(h.hora_cierre_2),
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
            className="space-y-2 rounded-md border border-neutral-200 bg-white px-3 py-3"
          >
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-800">
              <input
                type="checkbox"
                checked={h.activo}
                onChange={(e) => actualizarDia(index, "activo", e.target.checked)}
              />
              {DIAS_SEMANA[h.dia_semana]}
              {!h.activo && (
                <span className="text-xs font-normal text-neutral-400">Cerrado</span>
              )}
            </label>

            <div className="flex flex-wrap items-center gap-2">
              <span className="w-14 text-xs text-neutral-500">Mañana</span>
              <input
                type="time"
                className={claseHora}
                value={h.hora_apertura}
                disabled={!h.activo}
                onChange={(e) => actualizarDia(index, "hora_apertura", e.target.value)}
              />
              <span className="text-neutral-400 text-sm">a</span>
              <input
                type="time"
                className={claseHora}
                value={h.hora_cierre}
                disabled={!h.activo}
                onChange={(e) => actualizarDia(index, "hora_cierre", e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="w-14 text-xs text-neutral-500">Tarde</span>
              <input
                type="time"
                className={claseHora}
                value={h.hora_apertura_2}
                disabled={!h.activo}
                onChange={(e) => actualizarDia(index, "hora_apertura_2", e.target.value)}
              />
              <span className="text-neutral-400 text-sm">a</span>
              <input
                type="time"
                className={claseHora}
                value={h.hora_cierre_2}
                disabled={!h.activo}
                onChange={(e) => actualizarDia(index, "hora_cierre_2", e.target.value)}
              />
              {h.activo && (h.hora_apertura_2 || h.hora_cierre_2) && (
                <button
                  type="button"
                  onClick={() => quitarTarde(index)}
                  className="text-xs text-neutral-500 underline"
                >
                  Quitar tarde
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Button type="submit" disabled={enviando}>
        {enviando ? "Guardando..." : "Guardar horarios"}
      </Button>
    </form>
  );
}