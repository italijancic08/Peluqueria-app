import { addMinutes, isBefore } from "date-fns";
import { aUTC } from "@/lib/dates";

export type RangoBloqueado = { inicio: Date; fin: Date };
export type RangoTurnoOcupado = { inicio: Date; fin: Date; servicioIds: string[] };
export type ServicioConCupo = { id: string; cupoMaximo: number | null };

export type SlotConEstado = { inicio: Date; disponible: boolean };

interface CalcularSlotsParams {
  fechaISO: string;
  duracionMin: number;
  horaApertura: string;
  horaCierre: string;
  intervaloMin: number;
  capacidad: number;
  servicios: ServicioConCupo[];
  turnosOcupados: RangoTurnoOcupado[];
  bloqueos: RangoBloqueado[];
}

function seSuperponen(aIni: Date, aFin: Date, bIni: Date, bFin: Date): boolean {
  return isBefore(aIni, bFin) && isBefore(bIni, aFin);
}

/** Devuelve TODOS los horarios del día (abierto), cada uno marcado como disponible u ocupado. */
export function calcularSlotsDelDia(params: CalcularSlotsParams): SlotConEstado[] {
  const {
    fechaISO, duracionMin, horaApertura, horaCierre,
    intervaloMin, capacidad, servicios, turnosOcupados, bloqueos,
  } = params;

  const apertura = aUTC(new Date(`${fechaISO}T${horaApertura}`));
  const cierre = aUTC(new Date(`${fechaISO}T${horaCierre}`));

  const slots: SlotConEstado[] = [];
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

  return slots;
}