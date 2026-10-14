"use client";

import { useState } from "react";
import { Buscador } from "@/components/ui/buscador";
import { cn } from "@/lib/utils";
import { formatearPesos } from "@/lib/format";
import { normalizarTexto } from "@/lib/texto";
import { iconoParaServicio } from "@/lib/service-icons";
import { precioTarjeta } from "@/lib/precios";
import { variantesActivas, type Variantes } from "@/lib/seleccion";
import { SelectorVariante } from "./selector-variante";
import type { ServiceWithVariants } from "@/types/models";

type Props = {
  servicios: ServiceWithVariants[];
  value: string[];
  onChange: (ids: string[]) => void;
  variantes: Variantes;
  onVariantesChange: (variantes: Variantes) => void;
  recargoPct: number;
};

export function ServiciosGrid({
  servicios,
  value,
  onChange,
  variantes,
  onVariantesChange,
  recargoPct,
}: Props) {
  const [busqueda, setBusqueda] = useState("");

  const termino = normalizarTexto(busqueda);
  const filtrados = termino
    ? servicios.filter((s) => normalizarTexto(s.nombre).includes(termino))
    : servicios;

  function alternar(id: string) {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
      const resto = { ...variantes };
      delete resto[id];
      onVariantesChange(resto);
    } else {
      onChange([...value, id]);
    }
  }
  return (
    <div className="space-y-4">
      <Buscador value={busqueda} onChange={setBusqueda} placeholder="Buscar servicio" />

      <div>
        <h2 className="text-sm font-medium text-[#4A3428] mb-3">Servicios</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
          {filtrados.map((s) => {
            const Icon = iconoParaServicio(s.nombre);
            const seleccionado = value.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => alternar(s.id)}
                className="flex flex-col items-center gap-1.5 text-center"
              >
                <span
                  className={cn(
                    "flex h-16 w-16 items-center justify-center rounded-full border-2 transition-colors",
                    seleccionado
                      ? "bg-[#6B4635] border-[#6B4635]"
                      : "bg-[#F3E5D6] border-transparent hover:border-[#E8C7A6]"
                  )}
                >
                  <Icon className={cn("h-6 w-6", seleccionado ? "text-white" : "text-[#6B4635]")} />
                </span>
                <span className="text-xs font-medium text-[#4A3428] leading-tight">{s.nombre}</span>
                <span className="flex flex-col text-[11px] leading-tight text-[#9C8577]">
                  {variantesActivas(s).length > 0 && <span>Desde</span>}
                  <span>Efect. {formatearPesos(s.precio)}</span>
                  <span>Tarj. {formatearPesos(precioTarjeta(s.precio, recargoPct))}</span>
                </span>
              </button>
            );
          })}
          {filtrados.length === 0 && (
            <p className="col-span-full text-sm text-[#9C8577]">No hay servicios que coincidan.</p>
          )}
        </div>
      </div>

      {servicios
        .filter((s) => value.includes(s.id) && variantesActivas(s).length > 0)
        .map((s) => (
          <SelectorVariante
            key={s.id}
            servicio={s}
            value={variantes[s.id]}
            recargoPct={recargoPct}
            onChange={(varianteId) => onVariantesChange({ ...variantes, [s.id]: varianteId })}
          />
        ))}
    </div>
  );
}