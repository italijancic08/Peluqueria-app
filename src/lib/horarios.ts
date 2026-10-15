export type Franja = { apertura: string; cierre: string };

type HorarioDia = {
  hora_apertura: string | null;
  hora_cierre: string | null;
  hora_apertura_2: string | null;
  hora_cierre_2: string | null;
};

/** Franjas de atención de un día: cada turno (mañana y tarde) solo cuenta si está cargado. */
export function franjasDelHorario(h: HorarioDia): Franja[] {
  const franjas: Franja[] = [];
  if (h.hora_apertura && h.hora_cierre) {
    franjas.push({ apertura: h.hora_apertura, cierre: h.hora_cierre });
  }
  if (h.hora_apertura_2 && h.hora_cierre_2) {
    franjas.push({ apertura: h.hora_apertura_2, cierre: h.hora_cierre_2 });
  }
  return franjas;
}