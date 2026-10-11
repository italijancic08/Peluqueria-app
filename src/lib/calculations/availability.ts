import { addMinutes, isBefore } from "date-fns";
import { aUTC } from "@/lib/dates";
import type { Franja } from "@/lib/horarios";

export type RangoBloqueado = { inicio: Date; fin: Date };
export type RangoTurnoOcupado = { inicio: Date; fin: Date; servicioIds: string[] };
export type ServicioConCupo = { id: string; cupoMaximo: number | null };

export type SlotConEstado = { inicio: Date; disponible: boolean };

interface CalcularSlotsParams {
  fechaISO: string;
  duracionMin: number;
  franjas: Franja[];
  intervaloMin: number;
  capacidad: number;
  servicios: ServicioConCupo[];
  turnosOcupados: RangoTurnoOcupado[];
  bloqueos: RangoBloqueado[];
}

function seSuperponen(aIni: Date, aFin: Date, bIni: Date, bFin: Date): boolean {
  return isBefore(aIni, bFin) && isBefore(bIni, aFin);
}

/**
 * Devuelve TODOS los horarios del día (abierto), cada uno marcado como disponible u ocupado.
 * Si el día tiene dos franjas (mañana y tarde), los horarios de ambas van en orden y
 * un turno nunca puede cruzar el descanso del mediodía.
 */
export function calcularSlotsDelDia(params: CalcularSlotsParams): SlotConEstado[] {
  const {
    fechaISO, duracionMin, franjas,
    intervaloMin, capacidad, servicios, turnosOcupados, bloqueos,
  } = params;

  const slots: SlotConEstado[] = [];

  for (const franja of franjas) {
    const apertura = aUTC(new Date(`${fechaISO}T${franja.apertura}`));
    const cierre = aUTC(new Date(`${fechaISO}T${franja.cierre}`));

    let candidato = apertura;

    while (true) {
      const finCandidato = addMinutes(candidato, duracionMin);
      if (isBefore(cierre, finCandidato)) break;

      const bloqueado = bloqueos.some((b) =>
        seSuperponen(candidato, finCandidato, b.inicio, b.fin)
      );

      const solapados = turnosOcupados.filter((t) =>
        seSuperponen(candidato, finCandidato, t.inicio, t.fin)
      );

      const superaCapacidadGeneral = solapados.length >= capacidad;

      const superaCupoDeAlgunServicio = servicios.some((s) => {
        if (s.cupoMaximo == null) return false;
        const ocupadosDeEsteServicio = solapados.filter((t) =>
          t.servicioIds.includes(s.id)
        ).length;
        return ocupadosDeEsteServicio >= s.cupoMaximo;
      });

      slots.push({
        inicio: candidato,
        disponible: !bloqueado && !superaCapacidadGeneral && !superaCupoDeAlgunServicio,
      });

      candidato = addMinutes(candidato, intervaloMin);
    }
  }

  return slots;
}