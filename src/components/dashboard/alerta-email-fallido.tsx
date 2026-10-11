"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { MailX } from "lucide-react";
import { descartarEmailFallido } from "@/actions/notificaciones";

export type EmailFallidoItem = {
  id: string;
  tipoTexto: string;
  referencia: string | null;
  cliente: string;
  clientId: string | null;
  motivo: string | null;
};

export function AlertaEmailFallido({ item }: { item: EmailFallidoItem }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function abrir() {
    startTransition(async () => {
      await descartarEmailFallido(item.id);
      if (item.clientId) router.push(`/clientes/${item.clientId}`);
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
        <MailX className="h-5 w-5 text-[#A8741F]" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-[#4A3428]">
          {item.tipoTexto} sin enviar · {item.cliente}
        </p>
        <p className="break-words text-xs text-[#9C8577]">
          {item.referencia ? `${item.referencia}. ` : ""}
          {item.motivo ?? "No se pudo enviar el mail."}{" "}
          {item.clientId
            ? "Tocá para ver al cliente y revisar su email."
            : "Tocá para descartar este aviso."}
        </p>
      </div>
    </button>
  );
}