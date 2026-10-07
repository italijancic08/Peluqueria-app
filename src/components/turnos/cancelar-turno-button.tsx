"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cancelarTurno } from "@/actions/appointments";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";

export function CancelarTurnoButton({ id }: { id: string }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function cerrar() {
    setAbierto(false);
    setError(null);
  }

  function confirmar() {
    setError(null);
    startTransition(async () => {
      const res = await cancelarTurno(id, motivo);
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
    <>
      <Button variant="ghost" onClick={() => setAbierto(true)}>
        Cancelar
      </Button>

      <Modal abierto={abierto} onCerrar={cerrar} titulo="Cancelar turno">
        <div className="space-y-4">
          <p className="text-sm text-[#9C8577]">
            Se va a cancelar el turno y el cliente será avisado. Podés indicar el motivo.
          </p>

          {error && (
            <div className="rounded-lg border border-[#E8C9B8] bg-[#F7E9E2] px-3 py-2 text-sm text-[#B1543A]">
              {error}
            </div>
          )}

          <Textarea
            rows={3}
            maxLength={500}
            placeholder="Motivo de la cancelación (opcional)"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={cerrar} disabled={isPending}>
              Volver
            </Button>
            <Button variant="danger" onClick={confirmar} disabled={isPending}>
              {isPending ? "Cancelando..." : "Cancelar turno"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}