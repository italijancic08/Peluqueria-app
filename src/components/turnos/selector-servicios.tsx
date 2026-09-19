"use client";

import type { Service } from "@/types/models";
import { formatearPesos } from "@/lib/format";

type Props = {
  servicios: Service[];
  value: string[];
  onChange: (ids: string[]) => void;
};

export function SelectorServicios({ servicios, value, onChange }: Props) {
  function alternar(id: string) {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  }

  return (
    <div className="space-y-2">
      {servicios.map((s) => (
        <label
          key={s.id}
          className="flex items-center justify-between rounded-md border border-neutral-200 px-3 py-2 text-sm cursor-pointer hover:bg-neutral-50"
        >
          <span className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value.includes(s.id)}
              onChange={() => alternar(s.id)}
            />
            {s.nombre}
            <span className="text-neutral-400">({s.duracion_min} min)</span>
          </span>
          <span className="text-neutral-600">{formatearPesos(s.precio)}</span>
        </label>
      ))}
    </div>
  );
}