"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearComisionManual } from "@/actions/commissions";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatearPesos } from "@/lib/format";

type Empleado = {
  id: string;
  nombre: string;
  apellido: string;
  comision_pct: number;
};

export function ComisionManualForm({ empleados }: { empleados: Empleado[] }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [profileId, setProfileId] = useState("");
  const [monto, setMonto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const empleado = empleados.find((e) => e.id === profileId);
  const montoNum = Number(monto);
  const pct = empleado ? Number(empleado.comision_pct) : null;
  const comision =
    pct !== null && montoNum > 0 ? Math.round(montoNum * pct) / 100 : null;

  function cerrar() {
    setAbierto(false);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    setEnviando(true);
    const resultado = await crearComisionManual({
      profile_id: profileId,
      base_monto: montoNum,
      descripcion,
    });
    setEnviando(false);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }

    setProfileId("");
    setMonto("");
    setDescripcion("");
    setAbierto(false);
    router.refresh();
  }

  return (
    <>
      <Button onClick={() => setAbierto(true)}>+ Comisión manual</Button>

      <Modal abierto={abierto} onCerrar={cerrar} titulo="Comisión manual">
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="space-y-1">
            <label className="text-xs font-medium text-[#9C8577]">Empleado</label>
            <select
              className="w-full rounded-lg border border-[#EDD9C4] bg-white px-3 py-2 text-sm text-[#4A3428] outline-none focus:ring-2 focus:ring-[#6B4635] focus:border-transparent"
              value={profileId}
              onChange={(e) => setProfileId(e.target.value)}
              required
            >
              <option value="">Elegí un empleado</option>
              {empleados.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.apellido}, {emp.nombre} ({Number(emp.comision_pct)}%)
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-[#9C8577]">Total del trabajo</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="Total del trabajo"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-[#9C8577]">Descripción (opcional)</label>
            <Input
              placeholder="Ej: trabajo fuera del sistema"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              maxLength={300}
            />
          </div>

          {comision !== null && pct !== null && (
            <div className="rounded-lg border border-[#EDD9C4] bg-[#FBF3EA] p-3 text-sm text-[#4A3428]">
              <p className="text-xs text-[#9C8577]">
                {pct}% de {formatearPesos(montoNum)}
              </p>
              <p className="font-semibold">Comisión: {formatearPesos(comision)}</p>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={enviando}>
              {enviando ? "Guardando..." : "Cargar comisión"}
            </Button>
            <Button type="button" variant="secondary" onClick={cerrar}>
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}