"use client";

import { useEffect, useState } from "react";
import { obtenerDisponibilidad } from "@/actions/appointments";
import { SelectorFechaTira } from "./selector-fecha-tira";
import { cn } from "@/lib/utils";
import { hoyISO, mostrarHora } from "@/lib/dates";

type Slot = { horaISO: string; disponible: boolean };

type Props = {
  servicioIds: string[];
  variantes: Record<string, string>;
  value: string | null;
  onChange: (iso: string | null) => void;
};

export function TurnoScheduler({ servicioIds, variantes, value, onChange }: Props) {
  const [fecha, setFecha] = useState<string>(() => hoyISO());
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

    obtenerDisponibilidad(fecha, servicioIds, variantes).then((res) => {
      setCargando(false);
      if (!res.ok) {
        setError(res.error);
        setSlots([]);
        return;
      }
      setSlots(res.data.slots);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fecha, servicioIds.join(","), JSON.stringify(variantes)]);

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label className="text-sm font-medium text-[#4A3428]">Fecha</label>
        <SelectorFechaTira value={fecha} onChange={setFecha} />
      </div>

      {servicioIds.length === 0 && (
        <p className="text-sm text-[#9C8577]">Elegí al menos un servicio para ver horarios.</p>
      )}

      {cargando && <p className="text-sm text-[#9C8577]">Buscando horarios...</p>}
      {error && <p className="text-sm text-[#B1543A]">{error}</p>}

      {!cargando && !error && servicioIds.length > 0 && slots.length === 0 && (
        <p className="text-sm text-[#9C8577]">No hay horarios disponibles para ese día.</p>
      )}

      {slots.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
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
    </div>
  );
}