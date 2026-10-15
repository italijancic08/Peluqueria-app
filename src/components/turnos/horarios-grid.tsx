"use client";

import { useEffect, useState } from "react";
import { obtenerDisponibilidad } from "@/actions/appointments";
import { cn } from "@/lib/utils";
import { mostrarFinEstimado, mostrarHora } from "@/lib/dates";
import { SelectorFechaTira } from "./selector-fecha-tira";

type Slot = { horaISO: string; disponible: boolean };

type Props = {
  servicioIds: string[];
  variantes: Record<string, string>;
  fecha: string;
  onFechaChange: (fecha: string) => void;
  value: string | null;
  onChange: (iso: string | null) => void;
};

export function HorariosGrid({ servicioIds, variantes, fecha, onFechaChange, value, onChange }: Props) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [duracionMin, setDuracionMin] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (servicioIds.length === 0) return;
    setCargando(true);
    setError(null);
    onChange(null);

    obtenerDisponibilidad(fecha, servicioIds, variantes).then((res) => {
      setCargando(false);
      if (!res.ok) {
        setError(res.error);
        setSlots([]);
        return;
      }
      setSlots(res.data.slots);
      setDuracionMin(res.data.duracionMin);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fecha, servicioIds.join(","), JSON.stringify(variantes)]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-medium text-[#4A3428] mb-2">Elegí la fecha</h2>
        <SelectorFechaTira value={fecha} onChange={onFechaChange} />
      </div>

      <div>
        <h2 className="text-sm font-medium text-[#4A3428] mb-2">Elegí el horario</h2>

        {cargando && <p className="text-sm text-[#9C8577]">Buscando horarios...</p>}
        {error && <p className="text-sm text-[#B1543A]">{error}</p>}
        {!cargando && !error && slots.length === 0 && (
          <p className="text-sm text-[#9C8577]">No hay horarios disponibles para ese día.</p>
        )}

        {slots.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {slots.map((slot) => {
              const seleccionado = value === slot.horaISO;
              return (
                <button
                  key={slot.horaISO}
                  type="button"
                  disabled={!slot.disponible}
                  onClick={() => slot.disponible && onChange(slot.horaISO)}
                  className={cn(
                    "rounded-lg py-2 text-sm font-medium text-center transition-colors",
                    slot.disponible && !seleccionado && "bg-[#F3E5D6] text-[#4A3428] hover:bg-[#E8C7A6]",
                    slot.disponible && seleccionado && "bg-[#6B4635] text-white",
                    !slot.disponible && "bg-[#F3E5D6]/50 text-[#C4B6A8] cursor-not-allowed"
                  )}
                >
                  {slot.disponible ? mostrarHora(slot.horaISO) : "Ocupado"}
                </button>
              );
            })}
          </div>
        )}

        {value && duracionMin > 0 && (
          <div className="mt-3 rounded-lg border border-[#EDD9C4] bg-[#FBF3EA] px-3 py-2 text-sm text-[#4A3428]">
            Finalización estimada:{" "}
            <span className="font-semibold">{mostrarFinEstimado(value, duracionMin)}</span>
            <p className="text-xs text-[#9C8577]">Es un horario aproximado, puede variar según el trabajo.</p>
          </div>
        )}
      </div>
    </div>
  );
}