"use client";

import { useEffect, useRef, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { hoyISO } from "@/lib/dates";

const DIAS_CORTOS = ["L", "M", "M", "J", "V", "S", "D"];

type Props = {
  /** Fecha elegida, formato yyyy-MM-dd. */
  value: string;
  onChange: (fechaISO: string) => void;
  /** Fecha mínima permitida (yyyy-MM-dd). */
  min?: string;
  /** Fecha máxima permitida (yyyy-MM-dd). */
  max?: string;
  className?: string;
};

// Al mediodía, para evitar saltos de día por zona horaria.
function aFecha(iso: string): Date {
  return new Date(`${iso}T12:00:00`);
}

function aISO(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export function SelectorFecha({ value, onChange, min, max, className }: Props) {
  const hoy = hoyISO();
  const [abierto, setAbierto] = useState(false);
  const [mesVisible, setMesVisible] = useState(() => startOfMonth(aFecha(value || hoy)));
  const contenedor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;

    function onMouseDown(e: MouseEvent) {
      if (contenedor.current && !contenedor.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation(); // que no cierre también el modal que lo contiene
        setAbierto(false);
      }
    }

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [abierto]);

  function alternar() {
    if (!abierto) setMesVisible(startOfMonth(aFecha(value || hoy)));
    setAbierto((v) => !v);
  }

  function fueraDeRango(iso: string): boolean {
    return Boolean((min && iso < min) || (max && iso > max));
  }

  function elegir(iso: string) {
    if (fueraDeRango(iso)) return;
    onChange(iso);
    setAbierto(false);
  }

  const dias = eachDayOfInterval({
    start: startOfWeek(mesVisible, { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(mesVisible), { weekStartsOn: 1 }),
  });

  const sinMesAnterior = Boolean(min && aISO(endOfMonth(subMonths(mesVisible, 1))) < min);
  const sinMesSiguiente = Boolean(max && aISO(startOfMonth(addMonths(mesVisible, 1))) > max);

  return (
    <div ref={contenedor} className={cn("relative", className)}>
      <button
        type="button"
        onClick={alternar}
        aria-haspopup="dialog"
        aria-expanded={abierto}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-[#EDD9C4] bg-white px-3 py-2 text-sm text-[#4A3428] outline-none transition-colors focus:border-transparent focus:ring-2 focus:ring-[#6B4635]"
      >
        <span className="capitalize">
          {value ? format(aFecha(value), "EEE d MMM yyyy", { locale: es }) : "Elegí una fecha"}
        </span>
        <CalendarDays className="h-4 w-4 shrink-0 text-[#6B4635]" />
      </button>

      {abierto && (
        <div
          role="dialog"
          aria-label="Calendario"
          className="absolute left-0 top-full z-50 mt-1 w-72 max-w-[90vw] rounded-xl border border-[#EDD9C4] bg-white p-3 shadow-lg"
        >
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setMesVisible((m) => subMonths(m, 1))}
              disabled={sinMesAnterior}
              aria-label="Mes anterior"
              className="rounded-lg p-1.5 text-[#6B4635] transition-colors hover:bg-[#F6E4D3] disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold capitalize text-[#4A3428]">
              {format(mesVisible, "MMMM yyyy", { locale: es })}
            </span>
            <button
              type="button"
              onClick={() => setMesVisible((m) => addMonths(m, 1))}
              disabled={sinMesSiguiente}
              aria-label="Mes siguiente"
              className="rounded-lg p-1.5 text-[#6B4635] transition-colors hover:bg-[#F6E4D3] disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 text-center text-[11px] font-medium uppercase text-[#9C8577]">
            {DIAS_CORTOS.map((d, i) => (
              <span key={i} className="py-1">
                {d}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {dias.map((d) => {
              const iso = aISO(d);
              const delMes = d.getMonth() === mesVisible.getMonth();
              const elegido = iso === value;
              const esHoy = iso === hoy;
              const bloqueado = fueraDeRango(iso);

              return (
                <button
                  key={iso}
                  type="button"
                  disabled={bloqueado}
                  onClick={() => elegir(iso)}
                  aria-label={format(d, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
                  aria-pressed={elegido}
                  className={cn(
                    "flex h-9 items-center justify-center rounded-lg text-sm transition-colors",
                    elegido
                      ? "bg-[#6B4635] font-semibold text-white"
                      : delMes
                        ? "text-[#4A3428] hover:bg-[#F3E5D6]"
                        : "text-[#C4B6A8] hover:bg-[#F3E5D6]",
                    esHoy && !elegido && "border border-[#C98A3E] font-semibold",
                    bloqueado && "pointer-events-none opacity-40"
                  )}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>

          {!fueraDeRango(hoy) && (
            <div className="mt-2 flex justify-end border-t border-[#EDD9C4] pt-2">
              <button
                type="button"
                onClick={() => elegir(hoy)}
                className="rounded-lg px-2 py-1 text-xs font-medium text-[#6B4635] transition-colors hover:bg-[#F6E4D3]"
              >
                Hoy
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}