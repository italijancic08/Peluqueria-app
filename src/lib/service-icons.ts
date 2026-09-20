import { Scissors, Palette, Droplet, Sparkles, Wand2, type LucideIcon } from "lucide-react";

/**
 * Elige un ícono según palabras clave en el nombre del servicio.
 * Es solo decorativo — no afecta ninguna lógica de negocio.
 */
export function iconoParaServicio(nombre: string): LucideIcon {
  const n = nombre.toLowerCase();
  if (n.includes("corte") || n.includes("barba") || n.includes("afeit")) return Scissors;
  if (n.includes("tintura") || n.includes("color")) return Palette;
  if (n.includes("lavado") || n.includes("shampoo") || n.includes("hidrat")) return Droplet;
  if (n.includes("peinado") || n.includes("brushing") || n.includes("estilo")) return Wand2;
  return Sparkles;
}