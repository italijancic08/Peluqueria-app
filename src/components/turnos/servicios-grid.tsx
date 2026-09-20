"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatearPesos } from "@/lib/format";
import { iconoParaServicio } from "@/lib/service-icons";
import type { Service } from "@/types/models";

type Props = {
  servicios: Service[];
  value: string[];
  onChange: (ids: string[]) => void;
};

export function ServiciosGrid({ servicios, value, onChange }: Props) {
  const [busqueda, setBusqueda] = useState("");

  const filtrados = servicios.filter((s) =>
    s.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  function alternar(id: string) {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  }

  return (
    <div className="space-y-4">
      <Input
        type="search"
        placeholder="Buscar servicio"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

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
                <span className="text-xs text-[#9C8577]">{formatearPesos(s.precio)}</span>
              </button>
            );
          })}
          {filtrados.length === 0 && (
            <p className="col-span-full text-sm text-[#9C8577]">No hay servicios que coincidan.</p>
          )}
        </div>
      </div>
    </div>
  );
}