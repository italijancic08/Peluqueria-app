"use client";

import { useEffect, useState } from "react";
import { SelectorFechaTira } from "./selector-fecha-tira";
import { cn } from "@/lib/utils";
import { hoyISO, mostrarHora } from "@/lib/dates";
import type { ActionResult } from "@/types/models";

type Slot = { horaISO: string; disponible: boolean };

type Props = {
  cargarSlots: (fechaISO: string) => Promise<ActionResult<Slot[]>>;
  value: string | null;
  onChange: (iso: string | null) => void;
};

export function SelectorNuevoHorario({ cargarSlots, value, onChange }: Props) {
  const [fecha, setFecha] = useState(() => hoyISO());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError(null);
    onChange(null);

    cargarSlots(fecha).then((res) => {
      if (!activo) return;
      setCargando(false);
      if (!res.ok) {
        setError(res.error);
        setSlots([]);
        return;
      }
      setSlots(res.data);
    });

    return () => {
      activo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fecha]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-2 text-sm font-medium text-[#4A3428]">Elegí la fecha</h3>
        <SelectorFechaTira value={fecha} onChange={setFecha} />
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium text-[#4A3428]">Elegí el horario</h3>

        {cargando && <p className="text-sm text-[#9C8577]">Buscando horarios...</p>}
        {error && <p className="text-sm text-[#B1543A]">{error}</p>}
        {!cargando && !error && slots.length === 0 && (
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
                    "rounded-lg py-2 text-center text-sm font-medium transition-colors",
                    slot.disponible && !seleccionado && "bg-[#F3E5D6] text-[#4A3428] hover:bg-[#E8C7A6]",
                    slot.disponible && seleccionado && "bg-[#6B4635] text-white",
                    !slot.disponible && "cursor-not-allowed bg-[#F3E5D6]/50 text-[#C4B6A8]"
                  )}
                >
                  {slot.disponible ? mostrarHora(slot.horaISO) : "Ocupado"}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}