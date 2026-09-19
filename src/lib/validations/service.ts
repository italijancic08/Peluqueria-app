import { z } from "zod";

export const servicioSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(100),
  descripcion: z.string().trim().max(500).optional().or(z.literal("")),
  precio: z.coerce.number().min(0, "El precio no puede ser negativo"),
  duracion_min: z.coerce
    .number()
    .int("Tiene que ser un número entero")
    .min(5, "Mínimo 5 minutos")
    .max(600, "Máximo 600 minutos"),
});

export type ServicioFormValues = z.infer<typeof servicioSchema>;