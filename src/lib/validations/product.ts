import { z } from "zod";

export const productoSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(100),
  categoria: z.string().trim().max(100).optional().or(z.literal("")),
  unidad: z.enum(["G", "ML", "UNIDAD"]),
  stock_minimo: z.number().min(0, "No puede ser negativo"),
  costo: z.number().min(0, "No puede ser negativo").optional().nullable(),
});

export type ProductoFormValues = z.infer<typeof productoSchema>;

export const movimientoStockSchema = z.object({
  productId: z.string().uuid(),
  tipo: z.enum(["ENTRADA", "AJUSTE"]),
  cantidad: z.number(),
  motivo: z.string().trim().max(300).optional().or(z.literal("")),
});

export type MovimientoStockValues = z.infer<typeof movimientoStockSchema>;