import { z } from "zod";

export const businessSettingsSchema = z.object({
  nombre_negocio: z.string().trim().min(1, "El nombre es obligatorio").max(150),
  comision_default_pct: z.number().min(0).max(100),
  recargo_tarjeta_pct: z.number().min(0, "No puede ser negativo").max(300, "Máximo 300%"),
  capacidad_simultanea: z.number().int().min(1, "Mínimo 1"),
  intervalo_turnos_min: z.number().int().min(5, "Mínimo 5 minutos"),
  turnos_expiran: z.boolean(),
  expiracion_turno_min: z.number().int().min(1, "Mínimo 1 minuto").max(1440, "Máximo 1440 minutos (24 h)"),
  aviso_sin_tomar_min: z.number().int().min(1, "Mínimo 1 minuto").max(1440, "Máximo 1440 minutos (24 h)"),
});

export type BusinessSettingsValues = z.infer<typeof businessSettingsSchema>;

const horaSchema = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Hora inválida");

export const businessHoursSchema = z.object({
  horarios: z.array(
    z.object({
      id: z.string().uuid(),
      dia_semana: z.number().int().min(0).max(6),
      activo: z.boolean(),
      hora_apertura: horaSchema,
      hora_cierre: horaSchema,
      hora_apertura_2: horaSchema.nullable(),
      hora_cierre_2: horaSchema.nullable(),
    })
  ),
});

export type BusinessHoursValues = z.infer<typeof businessHoursSchema>;