import type { ServiceVariant, ServiceWithVariants } from "@/types/models";

/** "Balayage – Pelo largo", o solo el nombre del servicio si no tiene variante. */
export function nombreServicio(
  nombre: string | null | undefined,
  variante?: string | null
): string {
  const base = nombre ?? "Servicio";
  return variante ? `${base} – ${variante}` : base;
}

/** Variante elegida por servicio: { [id del servicio]: id de la variante }. */
export type Variantes = Record<string, string>;

/** Variantes activas de un servicio, de la más barata a la más cara. */
export function variantesActivas(s: ServiceWithVariants): ServiceVariant[] {
  return (s.service_variants ?? [])
    .filter((v) => v.activo)
    .sort((a, b) => Number(a.precio) - Number(b.precio));
}

export type ItemElegido = {
  servicio: ServiceWithVariants;
  variante: ServiceVariant | null;
  /** Precio en efectivo/transferencia (el de la variante si la hay). */
  precio: number;
  duracion_min: number;
  /** "Balayage – Pelo largo" o solo el nombre del servicio. */
  nombre: string;
};

/**
 * Servicios elegidos con el precio y la duración que corresponden a cada uno.
 * `faltantes` son los que tienen variantes y todavía no se eligió ninguna.
 */
export function resolverElegidos(
  servicios: ServiceWithVariants[],
  servicioIds: string[],
  variantes: Variantes
): { items: ItemElegido[]; faltantes: ServiceWithVariants[] } {
  const items: ItemElegido[] = [];
  const faltantes: ServiceWithVariants[] = [];

  for (const s of servicios) {
    if (!servicioIds.includes(s.id)) continue;

    const activas = variantesActivas(s);
    if (activas.length === 0) {
      items.push({
        servicio: s,
        variante: null,
        precio: Number(s.precio),
        duracion_min: s.duracion_min,
        nombre: s.nombre,
      });
      continue;
    }

    const elegida = activas.find((v) => v.id === variantes[s.id]);
    if (!elegida) {
      faltantes.push(s);
      continue;
    }

    items.push({
      servicio: s,
      variante: elegida,
      precio: Number(elegida.precio),
      duracion_min: elegida.duracion_min,
      nombre: `${s.nombre} – ${elegida.nombre}`,
    });
  }

  return { items, faltantes };
}