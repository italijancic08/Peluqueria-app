"use client";

import { cn } from "@/lib/utils";
import { variantesActivas } from "@/lib/seleccion";
import { PreciosDuales } from "./precios-duales";
import type { ServiceWithVariants } from "@/types/models";

type Props = {
  servicio: ServiceWithVariants;
  value: string | undefined;
  onChange: (varianteId: string) => void;
  recargoPct: number;
};

/** Lista de opciones (variantes) de un servicio, cada una con ambos precios. */
export function SelectorVariante({ servicio, value, onChange, recargoPct }: Props) {
  const variantes = variantesActivas(servicio);

  return (
    <div className="space-y-2 rounded-lg border border-[#EDD9C4] bg-[#FBF3EA] p-3">
      <p className="text-sm font-medium text-[#4A3428]">{servicio.nombre}: elegí una opción</p>

      <div className="space-y-1.5">
        {variantes.map((v) => {
          const elegida = value === v.id;
          return (
            <label
              key={v.id}
              className={cn(
                "flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm transition-colors",
                elegida
                  ? "border-[#6B4635] bg-[#F3E5D6]"
                  : "border-[#EDD9C4] bg-white hover:bg-[#F6E4D3]"
              )}
            >
              <span className="flex items-center gap-2 text-[#4A3428]">
                <input
                  type="radio"
                  name={`variante-${servicio.id}`}
                  className="accent-[#6B4635]"
                  checked={elegida}
                  onChange={() => onChange(v.id)}
                />
                {v.nombre}
                <span className="text-[#9C8577]">({v.duracion_min} min)</span>
              </span>
              <PreciosDuales precio={v.precio} recargoPct={recargoPct} />
            </label>
          );
        })}
      </div>
    </div>
  );
}