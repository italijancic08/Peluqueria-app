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
 *
 * En la ÚLTIMA franja del día (la que cierra el local) un turno puede empezar en cualquier
 * horario con el local abierto, aunque termine después del cierre (servicios largos).
 */
export function calcularSlotsDelDia(params: CalcularSlotsParams): SlotConEstado[] {
  const {
    fechaISO, duracionMin, franjas,
    intervaloMin, capacidad, servicios, turnosOcupados, bloqueos,
  } = params;

  const slots: SlotConEstado[] = [];

  for (let i = 0; i < franjas.length; i++) {
    const franja = franjas[i];
    const esUltimaFranja = i === franjas.length - 1;
    const apertura = aUTC(new Date(`${fechaISO}T${franja.apertura}`));
    const cierre = aUTC(new Date(`${fechaISO}T${franja.cierre}`));

    let candidato = apertura;

    while (true) {
      const finCandidato = addMinutes(candidato, duracionMin);
      if (esUltimaFranja) {
        // Última franja: alcanza con que el turno EMPIECE antes del cierre.
        if (!isBefore(candidato, cierre)) break;
      } else if (isBefore(cierre, finCandidato)) {
        // Franjas intermedias: el turno no puede pasarse del descanso.
        break;
      }

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