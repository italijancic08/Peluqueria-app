import { z } from "zod";

export const movimientoManualSchema = z.object({
  tipo: z.enum(["INGRESO", "EGRESO"]),
  metodo: z.enum(["EFECTIVO", "TRANSFERENCIA", "TARJETA_CREDITO", "TARJETA_DEBITO"]),
  monto: z.number().positive("El monto tiene que ser mayor a 0"),
  descripcion: z.string().trim().min(1, "Agregá una descripción").max(300),
});

export type MovimientoManualValues = z.infer<typeof movimientoManualSchema>;