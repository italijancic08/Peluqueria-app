import { z } from "zod";

export const varianteSchema = z.object({
  variante_id: z.string().uuid().optional().nullable(),
  nombre: z.string().trim().min(1, "Poné un nombre").max(100),
  precio: z.number({ error: "Ingresá un precio" }).min(0, "No puede ser negativo"),
  duracion_min: z
    .number({ error: "Ingresá la duración" })
    .int("Número entero")
    .min(5, "Mínimo 5 min")
    .max(1440, "Máximo 24 hs"),
});

export const servicioSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(100),
  descripcion: z.string().trim().max(500).optional().or(z.literal("")),
  precio: z.number().min(0, "El precio no puede ser negativo"),
  duracion_min: z
    .number()
    .int("Tiene que ser un número entero")
    .min(5, "Mínimo 5 minutos")
    .max(1440, "Máximo 24 horas"),
  cupo_maximo: z
    .number()
    .int()
    .min(1, "Mínimo 1")
    .optional()
    .nullable(),
  tiene_ficha_tecnica: z.boolean(),
  variantes: z.array(varianteSchema).max(30, "Demasiadas variantes"),
});

export type ServicioFormValues = z.infer<typeof servicioSchema>;