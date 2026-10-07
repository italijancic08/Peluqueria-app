"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { responderSolicitudStaff } from "@/actions/reprogramaciones";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";

export function ResponderSolicitudButtons({ solicitudId }: { solicitudId: string }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function aceptar() {
    if (!confirm("¿Aceptar el nuevo horario? El turno se va a mover.")) return;
    setError(null);
    startTransition(async () => {
      const res = await responderSolicitudStaff(solicitudId, true);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  function rechazar() {
    setError(null);
    startTransition(async () => {
      const res = await responderSolicitudStaff(solicitudId, false, motivo);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setAbierto(false);
      setMotivo("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Button onClick={aceptar} disabled={isPending} className="flex-1 sm:flex-none">
          Aceptar
        </Button>
        <Button
          variant="secondary"
          onClick={() => setAbierto(true)}
          disabled={isPending}
          className="flex-1 sm:flex-none"
        >
          Rechazar
        </Button>
      </div>

      {error && !abierto && <p className="text-xs text-[#B1543A]">{error}</p>}

      <Modal
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        titulo="Rechazar reprogramación"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#9C8577]">
            El turno se mantiene en su horario original. Podés explicarle al cliente el motivo.
          </p>

          {error && (
            <div className="rounded-lg border border-[#E8C9B8] bg-[#F7E9E2] px-3 py-2 text-sm text-[#B1543A]">
              {error}
            </div>
          )}

          <Textarea
            rows={3}
            maxLength={500}
            placeholder="Motivo del rechazo (opcional)"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setAbierto(false)} disabled={isPending}>
              Volver
            </Button>
            <Button variant="danger" onClick={rechazar} disabled={isPending}>
              {isPending ? "Enviando..." : "Rechazar"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}