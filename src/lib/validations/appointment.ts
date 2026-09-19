import { z } from "zod";

export const reservaPublicaSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(100),
  apellido: z.string().trim().min(1, "El apellido es obligatorio").max(100),
  telefono: z.string().trim().min(6, "Ingresá un teléfono válido").max(30),
  email: z.string().trim().email("Email inválido").max(150).optional().or(z.literal("")),
  servicioIds: z.array(z.string().uuid()).min(1, "Elegí al menos un servicio"),
  fechaHoraInicio: z.string().min(1, "Elegí un horario"),
  comentario: z.string().trim().max(500).optional().or(z.literal("")),
});

export type ReservaPublicaValues = z.infer<typeof reservaPublicaSchema>;

export const turnoInternoSchema = z.object({
  clientId: z.string().uuid("Elegí un cliente"),
  servicioIds: z.array(z.string().uuid()).min(1, "Elegí al menos un servicio"),
  fechaHoraInicio: z.string().min(1, "Elegí un horario"),
  asignarme: z.boolean().default(false),
  comentario: z.string().trim().max(500).optional().or(z.literal("")),
});

export type TurnoInternoValues = z.infer<typeof turnoInternoSchema>;