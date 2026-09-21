export const ESTADO_TURNO = {
  CONFIRMADO: "Confirmado",
  EN_CURSO: "En curso",
  FINALIZADO: "Finalizado",
  CANCELADO: "Cancelado",
  AUSENTE: "No asistió",
} as const;

export const ESTADO_PRESUPUESTO = {
  PENDIENTE: "Pendiente",
  ACEPTADO: "Aceptado",
  RECHAZADO: "Rechazado",
} as const;

export const ESTADO_TRABAJO = {
  DISPONIBLE: "Disponible",
  TOMADO: "Tomado",
  EN_CURSO: "En curso",
  FINALIZADO: "Finalizado",
  COBRADO: "Cobrado",
  CANCELADO: "Cancelado",
} as const;

export const MEDIO_PAGO = {
  EFECTIVO: "Efectivo",
  TRANSFERENCIA: "Transferencia",
  TARJETA_CREDITO: "Tarjeta de crédito",
  TARJETA_DEBITO: "Tarjeta de débito",
} as const;

export const UNIDAD = {
  G: "g",
  ML: "ml",
  UNIDAD: "u.",
} as const;


export const DIAS_SEMANA = [
  "Domingo", "Lunes", "Martes", "Miércoles",
  "Jueves", "Viernes", "Sábado",
] as const;