"use client";

import { cn } from "@/lib/utils";

const DIAS_CORTOS = ["DO", "LU", "MA", "MI", "JU", "VI", "SA"];

type Props = {
  value: string;
  onChange: (fechaISO: string) => void;
};

export function SelectorFechaTira({ value, onChange }: Props) {
  const hoy = new Date();
  const dias = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(hoy);
    d.setDate(hoy.getDate() + i);
    return d;
  });

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {dias.map((d) => {
        const iso = d.toISOString().slice(0, 10);
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