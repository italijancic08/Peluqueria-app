"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (valor: string) => void;
  placeholder?: string;
  className?: string;
};

export function Buscador({ value, onChange, placeholder = "Buscar", className }: Props) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9C8577]" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          // Evita que Enter envíe un formulario que lo contenga
          if (e.key === "Enter") e.preventDefault();
        }}
        className="pl-9 pr-9"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Limpiar búsqueda"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9C8577] hover:text-[#6B4635]"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}