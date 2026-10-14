/** Precio con tarjeta = precio en efectivo/transferencia + recargo (%). */
export function precioTarjeta(
  precioEfectivo: number | string,
  recargoPct: number | string
): number {
  return Math.round(Number(precioEfectivo) * (100 + Number(recargoPct))) / 100;
}