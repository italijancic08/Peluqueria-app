import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type ServicioResuelto = {
  id: string;
  nombre: string;
  /** Precio en efectivo/transferencia (el de la variante si la hay). */
  precio: number;
  duracion_min: number;
  cupo_maximo: number | null;
  variant_id: string | null;
  variante_nombre: string | null;
};

/**
 * Valida la selección (servicios + variante de cada uno) contra la base y devuelve
 * el precio y la duración definitivos. Es la única fuente de verdad: nunca se
 * confía en los precios que manda el navegador.
 */
export async function resolverServicios(
  cliente: SupabaseClient<Database>,
  servicioIds: string[],
  variantes: Record<string, string>,
  opciones: { soloActivos?: boolean } = {}
): Promise<{ ok: true; items: ServicioResuelto[] } | { ok: false; error: string }> {
  let consulta = cliente
    .from("services")
    .select(
      "id, nombre, precio, duracion_min, cupo_maximo, service_variants(id, nombre, precio, duracion_min, activo)"
    )
    .in("id", servicioIds);

  if (opciones.soloActivos) consulta = consulta.eq("activo", true);

  const { data, error } = await consulta;

  if (error || !data || data.length !== servicioIds.length) {
    return { ok: false, error: "Alguno de los servicios elegidos ya no está disponible." };
  }

  const items: ServicioResuelto[] = [];

  for (const s of data) {
    const activas = (s.service_variants ?? []).filter((v) => v.activo);

    if (activas.length === 0) {
      items.push({
        id: s.id,
        nombre: s.nombre,
        precio: Number(s.precio),
        duracion_min: s.duracion_min,
        cupo_maximo: s.cupo_maximo,
        variant_id: null,
        variante_nombre: null,
      });
      continue;
    }

    const elegida = activas.find((v) => v.id === variantes[s.id]);
    if (!elegida) {
      return { ok: false, error: `Elegí una opción para ${s.nombre}.` };
    }

    items.push({
      id: s.id,
      nombre: s.nombre,
      precio: Number(elegida.precio),
      duracion_min: elegida.duracion_min,
      cupo_maximo: s.cupo_maximo,
      variant_id: elegida.id,
      variante_nombre: elegida.nombre,
    });
  }

  return { ok: true, items };
}