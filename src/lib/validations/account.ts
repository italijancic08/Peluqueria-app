import { z } from "zod";

export const datosPersonalesSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(100),
  apellido: z.string().trim().min(1, "El apellido es obligatorio").max(100),
  telefono: z.string().trim().max(30).optional().or(z.literal("")),
});

export type DatosPersonalesValues = z.infer<typeof datosPersonalesSchema>;

export const cambiarEmailSchema = z.object({
  email: z.string().trim().email("Email inválido"),
});

export type CambiarEmailValues = z.infer<typeof cambiarEmailSchema>;

export const cambiarPasswordSchema = z
  .object({
    passwordActual: z.string().min(1, "Ingresá tu contraseña actual"),
    passwordNueva: z.string().min(6, "Mínimo 6 caracteres"),
    confirmarPassword: z.string().min(1, "Repetí la nueva contraseña"),
  })
  .refine((data) => data.passwordNueva === data.confirmarPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmarPassword"],
  });

export type CambiarPasswordValues = z.infer<typeof cambiarPasswordSchema>;