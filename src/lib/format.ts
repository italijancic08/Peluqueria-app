const PESOS = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatearPesos(monto: number | string | null): string {
  if (monto === null) return "—";
  return PESOS.format(Number(monto));
}

export function formatearTelefono(tel: string | null): string {
  if (!tel) return "—";
  const d = tel.replace(/\D/g, "");
  if (d.length === 10) return `(${d.slice(0, 4)}) ${d.slice(4, 6)} ${d.slice(6)}`;
  return tel;
}

export function normalizarTelefono(tel: string): string {
  return tel.replace(/\D/g, "");
}