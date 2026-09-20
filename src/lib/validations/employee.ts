import { z } from "zod";

export const empleadoSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(100),
  apellido: z.string().trim().min(1, "El apellido es obligatorio").max(100),
  email: z.string().trim().email("Email inválido").max(150),
  telefono: z.string().trim().max(30).optional().or(z.literal("")),
  rol: z.enum(["ADMIN", "EMPLEADO"]),
  comision_pct: z.number().min(0).max(100),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

export type EmpleadoFormValues = z.infer<typeof empleadoSchema>;

export const editarEmpleadoSchema = empleadoSchema.omit({ email: true, password: true });

export type EditarEmpleadoValues = z.infer<typeof editarEmpleadoSchema>;