"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  proponerReprogramacion,
  retirarPropuestaStaff,
  slotsParaTurno,
} from "@/actions/reprogramaciones";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { SelectorNuevoHorario } from "./selector-nuevo-horario";

export function ReprogramarTurnoButton({ id }: { id: string }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [slot, setSlot] = useState<string | null>(null);
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function cerrar() {
    setAbierto(false);
    setError(null);
    setSlot(null);
  }

  function enviar() {
    if (!slot) {
      setError("Elegí un nuevo horario.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await proponerReprogramacion(id, slot, motivo);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setAbierto(false);
      setSlot(null);
      setMotivo("");
      router.refresh();
    });
  }

  return (
    <>
      <Button variant="ghost" onClick={() => setAbierto(true)}>
        Reprogramar
      </Button>

      <Modal abierto={abierto} onCerrar={cerrar} titulo="Reprogramar turno">
        <div className="space-y-4">
          <p className="text-sm text-[#9C8577]">
            Elegí el nuevo horario. El cliente recibirá la propuesta y tendrá que aceptarla o
            rechazarla; hasta entonces el turno se mantiene como está.
          </p>

          <SelectorNuevoHorario
            cargarSlots={(fecha) => slotsParaTurno(id, fecha)}
            value={slot}
            onChange={setSlot}
          />

          <Textarea
            rows={3}
            maxLength={500}
            placeholder="Motivo de la reprogramación (opcional)"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />

          {error && (
            <div className="rounded-lg border border-[#E8C9B8] bg-[#F7E9E2] px-3 py-2 text-sm text-[#B1543A]">
              {error}
            </div>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={cerrar} disabled={isPending}>
              Volver
            </Button>
            <Button onClick={enviar} disabled={isPending || !slot}>
              {isPending ? "Enviando..." : "Proponer horario"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export function RetirarPropuestaButton({ solicitudId }: { solicitudId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function retirar() {
    if (!confirm("¿Retirar la propuesta de nuevo horario?")) return;
    startTransition(async () => {
      const res = await retirarPropuestaStaff(solicitudId);
      if (!res.ok) {
        alert(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <Button variant="ghost" onClick={retirar} disabled={isPending}>
      Retirar propuesta
    </Button>
  );
}