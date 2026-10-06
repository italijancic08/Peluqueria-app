/** Minúsculas, sin tildes y sin espacios sobrantes: "Péinado" -> "peinado". */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}