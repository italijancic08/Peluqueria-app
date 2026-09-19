import { z } from "zod";

export const clienteSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(100),
  apellido: z.string().trim().min(1, "El apellido es obligatorio").max(100),
  telefono: z.string().trim().min(6, "Ingresá un teléfono válido").max(30),
  dni: z.string().trim().max(20).optional().or(z.literal("")),
  email: z
    .string()
    .trim()
    .email("Email inválido")
    .max(150)
    .optional()
    .or(z.literal("")),
  notas: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type ClienteFormValues = z.infer<typeof clienteSchema>;