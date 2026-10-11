export type Franja = { apertura: string; cierre: string };

type HorarioDia = {
  hora_apertura: string;
  hora_cierre: string;
  hora_apertura_2: string | null;
  hora_cierre_2: string | null;
};

/** Franjas de atención de un día: la mañana siempre, la tarde solo si está cargada. */
export function franjasDelHorario(h: HorarioDia): Franja[] {
  const franjas: Franja[] = [{ apertura: h.hora_apertura, cierre: h.hora_cierre }];
  if (h.hora_apertura_2 && h.hora_cierre_2) {
    franjas.push({ apertura: h.hora_apertura_2, cierre: h.hora_cierre_2 });
  }
  return franjas;
}