"use client";

import { addDays, format } from "date-fns";
import { cn } from "@/lib/utils";
import { hoyISO } from "@/lib/dates";
import { SelectorFecha } from "@/components/ui/selector-fecha";

const DIAS_CORTOS = ["DO", "LU", "MA", "MI", "JU", "VI", "SA"];

type Props = {
  value: string;
  onChange: (fechaISO: string) => void;
  /** Solo personal: agrega un campo para elegir cualquier fecha, más allá de la tira. */
  fechaLibre?: boolean;
};

export function SelectorFechaTira({ value, onChange, fechaLibre = false }: Props) {
  // Se arma desde "hoy" en hora Argentina (al mediodía, para evitar saltos por zona horaria)
  const base = new Date(`${hoyISO()}T12:00:00`);
  const dias = Array.from({ length: 14 }, (_, i) => addDays(base, i));

  return (
    <div className="space-y-2">
    <div className="flex gap-2 overflow-x-auto pb-1">
      {dias.map((d) => {
        const iso = format(d, "yyyy-MM-dd");
        const seleccionado = iso === value;
        return (
          <button
            key={iso}
            type="button"
            onClick={() => onChange(iso)}
            className={cn(
              "flex flex-col items-center justify-center rounded-lg px-3 py-2 min-w-[52px] shrink-0 transition-colors",
              seleccionado
                ? "bg-[#6B4635] text-white"
                : "bg-[#F3E5D6] text-[#4A3428] hover:bg-[#E8C7A6]"
            )}
          >
            <span className="text-[10px] uppercase opacity-80">{DIAS_CORTOS[d.getDay()]}</span>
            <span className="text-sm font-semibold">{d.getDate()}</span>
          </button>
        );
      })}
    </div>

    {fechaLibre && (
      <div className="flex items-center gap-2">
        <label className="text-xs text-[#9C8577]">Otra fecha</label>
        <div className="w-56">
          <SelectorFecha value={value} min={hoyISO()} onChange={onChange} />
        </div>
      </div>
    )}
    </div>
  );
}