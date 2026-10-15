"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { eliminarServicio } from "@/actions/services";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

type Props = {
  id: string;
  nombre: string;
};

export function EliminarServicioButton({ id, nombre }: Props) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function cerrar() {
    if (enviando) return;
    setAbierto(false);
    setError(null);
  }

  async function confirmar() {
    setError(null);
    setEnviando(true);
    const resultado = await eliminarServicio(id);
    setEnviando(false);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }

    setAbierto(false);
    router.refresh();
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        className="text-[#B1543A] hover:bg-[#F7E9E2]"
        onClick={() => setAbierto(true)}
      >
        Eliminar
      </Button>

      <Modal abierto={abierto} onCerrar={cerrar} titulo="Eliminar servicio">
        <div className="space-y-4 text-left">
          <p className="text-sm text-[#4A3428]">
            ¿Eliminar el servicio <span className="font-semibold">{nombre}</span> y todas sus
            variantes? Esta acción no se puede deshacer.
          </p>

          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button type="button" variant="danger" onClick={confirmar} disabled={enviando}>
              {enviando ? "Eliminando..." : "Sí, eliminar"}
            </Button>
            <Button type="button" variant="secondary" onClick={cerrar} disabled={enviando}>
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}