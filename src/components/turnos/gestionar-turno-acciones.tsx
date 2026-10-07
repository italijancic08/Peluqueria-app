"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock } from "lucide-react";
import {
  cancelarTurnoPorCliente,
  responderPropuestaCliente,
  retirarSolicitudCliente,
  slotsParaToken,
  solicitarReprogramacionCliente,
} from "@/actions/reprogramaciones";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { SelectorNuevoHorario } from "./selector-nuevo-horario";
import type { ActionResult } from "@/types/models";

type Pendiente = {
  solicitadoPor: "CLIENTE" | "STAFF";
  inicioTexto: string;
  motivo: string | null;
};

type Props = {
  token: string;
  puedeGestionar: boolean;
  razonBloqueo: string | null;
  pendiente: Pendiente | null;
};

type ModalActivo = "reprogramar" | "cancelar" | "rechazar" | null;

function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[#E8C9B8] bg-[#F7E9E2] px-3 py-2 text-sm text-[#B1543A]">
      {children}
    </div>
  );
}

export function GestionarTurnoAcciones({
  token,
  puedeGestionar,
  razonBloqueo,
  pendiente,
}: Props) {
  const router = useRouter();
  const [modal, setModal] = useState<ModalActivo>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function cerrar() {
    setModal(null);
    setError(null);
    setSlot(null);
    setMotivo("");
  }

  function ejecutar(accion: () => Promise<ActionResult<unknown>>) {
    setError(null);
    startTransition(async () => {
      const res = await accion();
      if (!res.ok) {
        setError(res.error);
        return;
      }
      cerrar();
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {error && !modal && <ErrorBox>{error}</ErrorBox>}

      {/* El staff propuso otro horario: el cliente decide */}
      {pendiente?.solicitadoPor === "STAFF" && (
        <div className="space-y-3 rounded-xl border border-[#EDD9C4] bg-[#FBF0DC] p-4">
          <div className="flex items-start gap-2">
            <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-[#A8741F]" />
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium text-[#4A3428]">
                Te proponemos cambiar tu turno
              </p>
              <p className="text-sm text-[#4A3428]">Nuevo horario: {pendiente.inicioTexto}</p>
              {pendiente.motivo && (
                <p className="break-words text-sm text-[#9C8577]">Motivo: “{pendiente.motivo}”</p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              className="flex-1"
              disabled={isPending}
              onClick={() => ejecutar(() => responderPropuestaCliente(token, true))}
            >
              Aceptar nuevo horario
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              disabled={isPending}
              onClick={() => setModal("rechazar")}
            >
              Rechazar
            </Button>
          </div>
        </div>
      )}

      {/* El cliente pidió cambiar y espera respuesta */}
      {pendiente?.solicitadoPor === "CLIENTE" && (
        <div className="space-y-3 rounded-xl border border-[#EDD9C4] bg-[#FBF0DC] p-4">
          <div className="flex items-start gap-2">
            <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-[#A8741F]" />
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium text-[#4A3428]">
                Pediste cambiar tu turno y estamos revisándolo
              </p>
              <p className="text-sm text-[#4A3428]">Horario pedido: {pendiente.inicioTexto}</p>
              <p className="text-sm text-[#9C8577]">
                Hasta que te confirmemos, tu turno sigue en el horario original.
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            disabled={isPending}
            onClick={() => ejecutar(() => retirarSolicitudCliente(token))}
          >
            Retirar mi pedido
          </Button>
        </div>
      )}

      {puedeGestionar ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          {!pendiente && (
            <Button className="flex-1" onClick={() => setModal("reprogramar")}>
              Reprogramar turno
            </Button>
          )}
          <Button variant="secondary" className="flex-1" onClick={() => setModal("cancelar")}>
            Cancelar turno
          </Button>
        </div>
      ) : (
        razonBloqueo && <p className="text-sm text-[#9C8577]">{razonBloqueo}</p>
      )}

      {/* Reprogramar */}
      <Modal abierto={modal === "reprogramar"} onCerrar={cerrar} titulo="Reprogramar turno">
        <div className="space-y-4">
          <p className="text-sm text-[#9C8577]">
            Elegí el nuevo horario. Vamos a revisar tu pedido y te confirmamos; hasta entonces tu
            turno sigue como está.
          </p>

          <SelectorNuevoHorario
            cargarSlots={(fecha) => slotsParaToken(token, fecha)}
            value={slot}
            onChange={setSlot}
          />

          <Textarea
            rows={3}
            maxLength={500}
            placeholder="¿Por qué querés cambiarlo? (opcional)"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />

          {error && <ErrorBox>{error}</ErrorBox>}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={cerrar} disabled={isPending}>
              Volver
            </Button>
            <Button
              disabled={isPending || !slot}
              onClick={() => {
                if (!slot) return;
                ejecutar(() => solicitarReprogramacionCliente(token, slot, motivo));
              }}
            >
              {isPending ? "Enviando..." : "Enviar pedido"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Cancelar */}
      <Modal abierto={modal === "cancelar"} onCerrar={cerrar} titulo="Cancelar turno">
        <div className="space-y-4">
          <p className="text-sm text-[#9C8577]">
            ¿Seguro que querés cancelar tu turno? Esta acción no se puede deshacer.
          </p>

          <Textarea
            rows={3}
            maxLength={500}
            placeholder="¿Nos contás el motivo? (opcional)"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />

          {error && <ErrorBox>{error}</ErrorBox>}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={cerrar} disabled={isPending}>
              Volver
            </Button>
            <Button
              variant="danger"
              disabled={isPending}
              onClick={() => ejecutar(() => cancelarTurnoPorCliente(token, motivo))}
            >
              {isPending ? "Cancelando..." : "Sí, cancelar turno"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Rechazar la propuesta del staff */}
      <Modal abierto={modal === "rechazar"} onCerrar={cerrar} titulo="Rechazar nuevo horario">
        <div className="space-y-4">
          <p className="text-sm text-[#9C8577]">
            Tu turno se mantiene en el horario original. Si querés, contanos por qué.
          </p>

          <Textarea
            rows={3}
            maxLength={500}
            placeholder="Motivo (opcional)"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />

          {error && <ErrorBox>{error}</ErrorBox>}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={cerrar} disabled={isPending}>
              Volver
            </Button>
            <Button
              variant="danger"
              disabled={isPending}
              onClick={() => ejecutar(() => responderPropuestaCliente(token, false, motivo))}
            >
              {isPending ? "Enviando..." : "Rechazar propuesta"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}