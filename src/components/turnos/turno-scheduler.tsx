"use client";

import { useEffect, useState } from "react";
import { obtenerDisponibilidad } from "@/actions/appointments";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { mostrarHora } from "@/lib/dates";

type Slot = { horaISO: string; disponible: boolean };

type Props = {
  servicioIds: string[];
  value: string | null;
  onChange: (iso: string | null) => void;
};

export function TurnoScheduler({ servicioIds, value, onChange }: Props) {
  const [fecha, setFecha] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (servicioIds.length === 0) {
      setSlots([]);
      return;
    }

    setCargando(true);
    setError(null);
    onChange(null);

    obtenerDisponibilidad(fecha, servicioIds).then((res) => {
      setCargando(false);
      if (!res.ok) {
        setError(res.error);
        setSlots([]);
        return;
      }
      setSlots(res.data.slots);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fecha, servicioIds.join(",")]);

  return (
    <div className="space-y-3">
      <div className="space-y-1 max-w-xs">
        <label className="text-sm font-medium text-neutral-700">Fecha</label>
        <Input
          type="date"
          value={fecha}
          min={new Date().toISOString().slice(0, 10)}
          onChange={(e) => setFecha(e.target.value)}
        />
      </div>

      {servicioIds.length === 0 && (
        <p className="text-sm text-neutral-500">Elegí al menos un servicio para ver horarios.</p>
      )}

      {cargando && <p className="text-sm text-neutral-500">Buscando horarios...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!cargando && !error && servicioIds.length > 0 && slots.length === 0 && (
        <p className="text-sm text-neutral-500">Ese día no hay atención.</p>
      )}

      {slots.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {slots.map((slot) => {
            const seleccionado = value === slot.horaISO;
            return (
              <button
                key={slot.horaISO}
                type="button"
                disabled={!slot.disponible}
                onClick={() => slot.disponible && onChange(slot.horaISO)}
                className={cn(
                  "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors border",
                  slot.disponible &&
                    !seleccionado &&
                    "bg-white text-neutral-900 border-neutral-300 hover:bg-neutral-50 cursor-pointer",
                  slot.disponible &&
                    seleccionado &&
                    "bg-neutral-900 text-white border-neutral-900 cursor-pointer",
                  !slot.disponible &&
                    "bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed line-through"
                )}
              >
                {mostrarHora(slot.horaISO)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}