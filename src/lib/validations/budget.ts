import { z } from "zod";

export const presupuestoSchema = z.object({
  clientId: z.string().uuid("Elegí un cliente"),
  servicioIds: z.array(z.string().uuid()).min(1, "Elegí al menos un servicio"),
  notas: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type PresupuestoFormValues = z.infer<typeof presupuestoSchema>;