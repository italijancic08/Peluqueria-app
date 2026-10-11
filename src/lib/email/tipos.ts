export const TIPOS_EMAIL = [
  "COMPROBANTE",
  "PRESUPUESTO",
  "TURNO_CONFIRMADO",
  "TURNO_CANCELADO",
  "REPROGRAMACION_PROPUESTA",
  "REPROGRAMACION_SOLICITADA",
  "REPROGRAMACION_CONFIRMADA",
  "REPROGRAMACION_RECHAZADA",
] as const;

export type TipoEmail = (typeof TIPOS_EMAIL)[number];

export const ETIQUETA_TIPO_EMAIL: Record<TipoEmail, string> = {
  COMPROBANTE: "Comprobante",
  PRESUPUESTO: "Presupuesto",
  TURNO_CONFIRMADO: "Turno confirmado",
  TURNO_CANCELADO: "Turno cancelado",
  REPROGRAMACION_PROPUESTA: "Reprogramación propuesta",
  REPROGRAMACION_SOLICITADA: "Reprogramación solicitada",
  REPROGRAMACION_CONFIRMADA: "Turno reprogramado",
  REPROGRAMACION_RECHAZADA: "Reprogramación rechazada",
};

export const ESTADOS_EMAIL = ["ENVIADO", "FALLIDO"] as const;
export type EstadoEmail = (typeof ESTADOS_EMAIL)[number];