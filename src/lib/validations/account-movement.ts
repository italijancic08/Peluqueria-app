import { z } from "zod";

export const movimientoCCManualSchema = z.object({
  clientId: z.string().uuid(),
  tipo: z.enum(["DEBITO", "CREDITO"]),
  monto: z.number().positive("El monto tiene que ser mayor a 0"),
  descripcion: z.string().trim().max(300).optional().or(z.literal("")),
});

export type MovimientoCCManualValues = z.infer<typeof movimientoCCManualSchema>;

export const pagoCCSchema = z.object({
  clientId: z.string().uuid(),
  monto: z.number().positive("El monto tiene que ser mayor a 0"),
  metodo: z.enum(["EFECTIVO", "TRANSFERENCIA", "TARJETA_CREDITO", "TARJETA_DEBITO"]),
  descripcion: z.string().trim().max(300).optional().or(z.literal("")),
});

export type PagoCCValues = z.infer<typeof pagoCCSchema>;