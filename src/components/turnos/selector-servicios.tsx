"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import type { Service } from "@/types/models";
import { Input } from "@/components/ui/input";
import { formatearPesos } from "@/lib/format";
import { cn } from "@/lib/utils";

type Props = {
  servicios: Service[];
  value: string[];
  onChange: (ids: string[]) => void;
};

// Ignora mayúsculas y tildes: "peinado" encuentra "Péinado", etc.
function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function SelectorServicios({ servicios, value, onChange }: Props) {
  const [busqueda, setBusqueda] = useState("");

  const termino = normalizar(busqueda);
  const filtrados = termino
    ? servicios.filter((s) => normalizar(s.nombre).includes(termino))
    : servicios;

  function alternar(id: string) {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9C8577]" />
        <Input
          type="text"
          placeholder="Buscar servicio"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          onKeyDown={(e) => {
            // Evita que Enter envíe el formulario completo
            if (e.key === "Enter") e.preventDefault();
          }}
          className="pl-9 pr-9"
        />
        {busqueda && (
          <button
            type="button"
            onClick={() => setBusqueda("")}
            aria-label="Limpiar búsqueda"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9C8577] hover:text-[#6B4635]"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="max-h-72 space-y-2 overflow-y-auto">
        {filtrados.map((s) => {
          const seleccionado = value.includes(s.id);
          return (
            <label
              key={s.id}
              className={cn(
                "flex items-center justify-between rounded-lg border px-3 py-2 text-sm cursor-pointer transition-colors",
                seleccionado
                  ? "border-[#6B4635] bg-[#F3E5D6]"
                  : "border-[#EDD9C4] bg-white hover:bg-[#F6E4D3]"
              )}
            >
              <span className="flex items-center gap-2 text-[#4A3428]">
                <input
                  type="checkbox"
                  className="accent-[#6B4635]"
                  checked={seleccionado}
                  onChange={() => alternar(s.id)}
                />
                {s.nombre}
                <span className="text-[#9C8577]">({s.duracion_min} min)</span>
              </span>
              <span className="text-[#9C8577]">{formatearPesos(s.precio)}</span>
            </label>
          );
        })}
        {filtrados.length === 0 && (
          <p className="text-sm text-[#9C8577]">No hay servicios que coincidan.</p>
        )}
      </div>

      {value.length > 0 && (
        <p className="text-xs text-[#9C8577]">
          {value.length} {value.length === 1 ? "servicio seleccionado" : "servicios seleccionados"}
        </p>
      )}
    </div>
  );
}