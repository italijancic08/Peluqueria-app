import { fromZonedTime, formatInTimeZone } from "date-fns-tz";
import { ZONA } from "@/lib/dates";

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

const METODOS_TARJETA = ["TARJETA", "TARJETA_CREDITO", "TARJETA_DEBITO"];

/** Mes actual (yyyy-MM) en la zona horaria del negocio, no en UTC. */
export function mesActualISO(): string {
  return formatInTimeZone(new Date(), ZONA, "yyyy-MM");
}

export function esMesValido(mes: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(mes);
}

export function mesSiguiente(mesISO: string): string {
  const [anio, mes] = mesISO.split("-").map(Number);
  return mes === 12
    ? `${anio + 1}-01`
    : `${anio}-${String(mes + 1).padStart(2, "0")}`;
}

/** "2026-09" → "Septiembre de 2026" */
export function etiquetaMes(mesISO: string): string {
  const [anio, mes] = mesISO.split("-").map(Number);
  const nombre = MESES[mes - 1];
  return `${nombre.charAt(0).toUpperCase()}${nombre.slice(1)} de ${anio}`;
}

/**
 * Límites del mes en hora argentina, expresados en UTC para consultar la base.
 * `hasta` es exclusivo: usar .gte(desde) y .lt(hasta).
 */
export function limitesDelMes(mesISO: string): { desde: string; hasta: string } {
  return {
    desde: fromZonedTime(`${mesISO}-01T00:00:00`, ZONA).toISOString(),
    hasta: fromZonedTime(`${mesSiguiente(mesISO)}-01T00:00:00`, ZONA).toISOString(),
  };
}

export type MovimientoParaResumen = {
  tipo: string;
  metodo: string;
  monto: number | string;
};

export type ResumenMovimientos = {
  ingresos: number;
  egresos: number;
  /** Neto del mes en efectivo (ingresos - egresos). */
  efectivo: number;
  /** Neto del mes por transferencia. */
  transferencias: number;
  /** Neto del mes con tarjeta (crédito + débito). */
  tarjetas: number;
};

const redondear = (n: number) => Math.round(n * 100) / 100;

/** Mismo criterio que la función SQL cerrar_mes(). */
export function resumirMovimientos(
  movimientos: MovimientoParaResumen[]
): ResumenMovimientos {
  const r: ResumenMovimientos = {
    ingresos: 0,
    egresos: 0,
    efectivo: 0,
    transferencias: 0,
    tarjetas: 0,
  };

  for (const m of movimientos) {
    const monto = Number(m.monto);
    const signo = m.tipo === "INGRESO" ? 1 : -1;

    if (signo === 1) r.ingresos += monto;
    else r.egresos += monto;

    if (m.metodo === "EFECTIVO") r.efectivo += signo * monto;
    else if (m.metodo === "TRANSFERENCIA") r.transferencias += signo * monto;
    else if (METODOS_TARJETA.includes(m.metodo)) r.tarjetas += signo * monto;
  }

  return {
    ingresos: redondear(r.ingresos),
    egresos: redondear(r.egresos),
    efectivo: redondear(r.efectivo),
    transferencias: redondear(r.transferencias),
    tarjetas: redondear(r.tarjetas),
  };
}