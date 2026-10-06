export type VarianteEstado = "success" | "neutral" | "danger" | "warning";

export type EstadoTurnoVista = {
  etiqueta: string;
  variante: VarianteEstado;
  puedeCancelar: boolean;
};

type Params = {
  estadoTurno: string;
  estadoTrabajo?: string | null;
  inicio: string | Date;
  ahora: number; // milisegundos
  avisoMin: number;
};

/**
 * Estado que se muestra en la agenda.
 *
 * Importante: "Tomado" solo significa que un empleado quedó asignado de
 * antemano. El cliente llegó recién cuando el trabajo está "En proceso".
 */
export function estadoTurnoVista({
  estadoTurno,
  estadoTrabajo,
  inicio,
  ahora,
  avisoMin,
}: Params): EstadoTurnoVista {
  if (estadoTurno === "CANCELADO") {
    return { etiqueta: "Cancelado", variante: "danger", puedeCancelar: false };
  }
  if (estadoTurno === "AUSENTE") {
    return { etiqueta: "No asistió", variante: "danger", puedeCancelar: false };
  }
  if (estadoTrabajo === "EN_CURSO") {
    return { etiqueta: "En proceso", variante: "success", puedeCancelar: false };
  }
  if (estadoTrabajo === "FINALIZADO") {
    return { etiqueta: "Finalizado", variante: "neutral", puedeCancelar: false };
  }
  if (estadoTrabajo === "COBRADO") {
    return { etiqueta: "Cobrado", variante: "success", puedeCancelar: false };
  }

  // Todavía no llegó el cliente: el trabajo está DISPONIBLE o TOMADO.
  const minutosHastaTurno = (new Date(inicio).getTime() - ahora) / 60000;

  if (minutosHastaTurno < 0) {
    return { etiqueta: "Demorado", variante: "warning", puedeCancelar: true };
  }
  if (estadoTrabajo === "DISPONIBLE") {
    return {
      etiqueta: "Sin tomar",
      variante: minutosHastaTurno <= avisoMin ? "danger" : "neutral",
      puedeCancelar: true,
    };
  }
  return { etiqueta: "Confirmado", variante: "success", puedeCancelar: true };
}