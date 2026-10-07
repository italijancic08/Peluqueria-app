import { z } from "zod";

export const tokenSchema = z.string().regex(/^[a-f0-9]{64}$/, "Enlace inválido");

export const motivoSchema = z
  .string()
  .trim()
  .max(500, "El motivo puede tener hasta 500 caracteres")
  .optional()
  .or(z.literal(""));

export const fechaISOSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida");

export const fechaHoraSchema = z.string().min(1, "Elegí un horario");

export const idSchema = z.string().uuid("Identificador inválido");