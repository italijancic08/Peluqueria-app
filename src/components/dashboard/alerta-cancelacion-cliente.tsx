"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarX } from "lucide-react";
import { descartarCancelacion } from "@/actions/notificaciones";

export type CancelacionClienteItem = {
  id: string;
  numero: number;
  cliente: string;
  inicioTexto: string;
  fechaAgenda: string;
  motivo: string | null;
};

export function AlertaCancelacionCliente({ item }: { item: CancelacionClienteItem }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function abrir() {
    startTransition(async () => {
      await descartarCancelacion(item.id);
      router.push(`/agenda?fecha=${item.fechaAgenda}`);
    });
  }

  return (
    <button
      type="button"
      onClick={abrir}
      disabled={isPending}
      className="flex w-full items-center gap-3 rounded-xl border border-[#E8C7A6] bg-[#FBF0DC] p-4 text-left transition-colors hover:bg-[#F6E4D3] disabled:opacity-60"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/70">
        <CalendarX className="h-5 w-5 text-[#A8741F]" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-[#4A3428]">
          #{item.numero} · {item.cliente} canceló su turno
        </p>
        <p className="break-words text-xs text-[#9C8577]">
          Era el {item.inicioTexto}.
          {item.motivo ? ` Motivo: “${item.motivo}”.` : ""} Tocá para verlo en la agenda.
        </p>
      </div>
    </button>
  );
}