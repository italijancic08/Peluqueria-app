import Link from "next/link";
import { CalendarClock } from "lucide-react";

export type ReprogramacionClienteItem = {
  id: string;
  numero: number;
  cliente: string;
  inicioActualTexto: string;
  inicioPropuestoTexto: string;
};

export function AlertaReprogramacionCliente({ item }: { item: ReprogramacionClienteItem }) {
  return (
    <Link
      href="/agenda"
      className="flex items-center gap-3 rounded-xl border border-[#E8C7A6] bg-[#FBF0DC] p-4 transition-colors hover:bg-[#F6E4D3]"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/70">
        <CalendarClock className="h-5 w-5 text-[#A8741F]" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-[#4A3428]">
          #{item.numero} · {item.cliente} pidió reprogramar su turno
        </p>
        <p className="break-words text-xs text-[#9C8577]">
          Del {item.inicioActualTexto} al {item.inicioPropuestoTexto}. Tocá para aceptar o
          rechazar.
        </p>
      </div>
    </Link>
  );
}