"use client";

import { useState, type ReactNode } from "react";
import { CalendarCheck, CalendarPlus, Scissors } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "reservar" | "gestionar";

type Props = {
  inicial?: Tab;
  reservar: ReactNode;
  gestionar: ReactNode;
};

const TEXTOS: Record<Tab, { titulo: string; subtitulo: string }> = {
  reservar: {
    titulo: "Reservar turno",
    subtitulo: "Elegí el servicio, el día y el horario que prefieras.",
  },
  gestionar: {
    titulo: "Gestionar turno",
    subtitulo: "Ingresá el código que recibiste al sacar tu turno.",
  },
};

export function TurnosTabs({ inicial = "reservar", reservar, gestionar }: Props) {
  const [tab, setTab] = useState<Tab>(inicial);
  const posicion = tab === "reservar" ? 0 : 1;

  const botones: { id: Tab; etiqueta: string; icono: ReactNode }[] = [
    { id: "reservar", etiqueta: "Sacar turno", icono: <CalendarPlus className="h-4 w-4" /> },
    { id: "gestionar", etiqueta: "Gestionar turno", icono: <CalendarCheck className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      <div role="tablist" className="relative grid grid-cols-2 rounded-xl bg-[#F6E4D3] p-1">
        <span
          aria-hidden="true"
          className="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-lg bg-white shadow-sm transition-transform duration-300 ease-out"
          style={{ transform: `translateX(${posicion * 100}%)` }}
        />
        {botones.map((b) => (
          <button
            key={b.id}
            type="button"
            role="tab"
            aria-selected={tab === b.id}
            onClick={() => setTab(b.id)}
            className={cn(
              "relative z-10 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              tab === b.id ? "text-[#4A3428]" : "text-[#9C8577] hover:text-[#6B4635]"
            )}
          >
            {b.icono}
            {b.etiqueta}
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center text-center gap-2">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#6B4635]">
          <Scissors className="h-6 w-6 text-white" />
        </span>
        <h1 className="text-xl font-semibold text-[#4A3428] font-[family-name:var(--font-display)]">
          {TEXTOS[tab].titulo}
        </h1>
        <p className="text-sm text-[#9C8577]">{TEXTOS[tab].subtitulo}</p>
      </div>

      {/* Ambos quedan montados: al volver a "Sacar turno" no se pierde lo que ya cargó */}
      <div hidden={tab !== "reservar"}>{reservar}</div>
      <div hidden={tab !== "gestionar"}>{gestionar}</div>
    </div>
  );
}