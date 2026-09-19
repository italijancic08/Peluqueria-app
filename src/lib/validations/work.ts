import { z } from "zod";

export const consumoSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      cantidad: z.number().positive("La cantidad tiene que ser mayor a 0"),
    })
  ),
});

export type ConsumoFormValues = z.infer<typeof consumoSchema>;

export const pagoSchema = z.object({
  items: z
    .array(
      z.object({
        metodo: z.enum(["EFECTIVO", "TRANSFERENCIA", "TARJETA"]),
        monto: z.number().positive("El monto tiene que ser mayor a 0"),
      })
    )
    .min(1, "Agregá al menos un pago"),
});

export type PagoFormValues = z.infer<typeof pagoSchema>;