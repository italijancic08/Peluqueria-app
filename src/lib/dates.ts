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

/** Semana laboral del negocio: lunes a sábado. */
export function semanaLaboral(fecha: Date): { inicio: Date; fin: Date } {
  const inicio = startOfWeek(fecha, { weekStartsOn: 1 });
  return { inicio, fin: addDays(inicio, 5) };
}