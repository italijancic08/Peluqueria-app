"use client";

import { addDays, format } from "date-fns";
import { cn } from "@/lib/utils";
import { hoyISO } from "@/lib/dates";

const DIAS_CORTOS = ["DO", "LU", "MA", "MI", "JU", "VI", "SA"];

type Props = {
  value: string;
  onChange: (fechaISO: string) => void;
};

export function SelectorFechaTira({ value, onChange }: Props) {
  // Se arma desde "hoy" en hora Argentina (al mediodía, para evitar saltos por zona horaria)
  const base = new Date(`${hoyISO()}T12:00:00`);
  const dias = Array.from({ length: 14 }, (_, i) => addDays(base, i));

  return (
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
  );
}