type ConNombre = { nombre?: string | null; apellido?: string | null };

/** "Apellido, Nombre"; si no hay apellido, solo "Nombre". */
export function etiquetaCliente(c: ConNombre | null | undefined): string {
  return [c?.apellido, c?.nombre]
    .map((x) => (x ?? "").trim())
    .filter(Boolean)
    .join(", ");
}