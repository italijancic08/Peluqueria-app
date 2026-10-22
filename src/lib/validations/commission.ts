import { z } from "zod";

export const comisionManualSchema = z.object({
  profile_id: z.uuid("Elegí un empleado"),
  base_monto: z.number().positive("El total tiene que ser mayor a 0"),
  descripcion: z.string().trim().max(300).optional().or(z.literal("")),
});

export type ComisionManualValues = z.infer<typeof comisionManualSchema>;