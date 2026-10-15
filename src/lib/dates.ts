import { formatInTimeZone, toZonedTime, fromZonedTime } from "date-fns-tz";
import { startOfWeek, addDays } from "date-fns";
import { es } from "date-fns/locale";

export const ZONA = "America/Argentina/Buenos_Aires";

/** Fecha UTC de la base → texto en hora local. */
export function mostrarFecha(fecha: string | Date, patron = "dd/MM/yyyy"): string {
  return formatInTimeZone(new Date(fecha), ZONA, patron, { locale: es });
}

export function mostrarFechaHora(fecha: string | Date): string {
  return mostrarFecha(fecha, "dd/MM/yyyy HH:mm");
}

export function mostrarHora(fecha: string | Date): string {
  return mostrarFecha(fecha, "HH:mm");
}

/** Hora local elegida por el usuario → UTC para guardar. */
export function aUTC(fechaLocal: Date): Date {
  return fromZonedTime(fechaLocal, ZONA);
}

export function aLocal(fechaUTC: string | Date): Date {
  return toZonedTime(new Date(fechaUTC), ZONA);
}

/** Fecha de hoy (yyyy-MM-dd) en la zona horaria del negocio, no en UTC. */
export function hoyISO(): string {
  return formatInTimeZone(new Date(), ZONA, "yyyy-MM-dd");
}

/** Semana laboral del negocio: lunes a sábado. */
export function semanaLaboral(fecha: Date): { inicio: Date; fin: Date } {
  const inicio = startOfWeek(fecha, { weekStartsOn: 1 });
  return { inicio, fin: addDays(inicio, 5) };
}

/**
 * Horario estimado de finalización de un turno: "22:30", o "01:00 (día siguiente)"
 * si el turno termina después de la medianoche.
 */
export function mostrarFinEstimado(inicio: string | Date, duracionMin: number): string {
  const fin = new Date(new Date(inicio).getTime() + duracionMin * 60000);
  const hora = mostrarHora(fin);
  return mostrarFecha(fin, "yyyy-MM-dd") === mostrarFecha(inicio, "yyyy-MM-dd")
    ? hora
    : `${hora} (día siguiente)`;
}