import { z } from "zod";

export const LARGO_CODIGO = 6;

/** Deja solo letras/números en mayúscula (acepta "k7m-4px", "K7M 4PX", etc.). */
export function normalizarCodigo(valor: string): string {
  return valor.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** K7M4PX -> K7M-4PX (solo para mostrar). */
export function formatearCodigo(codigo: string | null | undefined): string {
  if (!codigo) return "—";
  return `${codigo.slice(0, 3)}-${codigo.slice(3)}`;
}

export const codigoTurnoSchema = z
  .string()
  .regex(/^[A-HJ-NP-Z2-9]{6}$/, "El código tiene 6 caracteres (letras y números).");