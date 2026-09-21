"use client";

type MedioPagoValue = "EFECTIVO" | "TRANSFERENCIA" | "TARJETA_CREDITO" | "TARJETA_DEBITO";

function principalDe(v: MedioPagoValue): "EFECTIVO" | "TRANSFERENCIA" | "TARJETA" {
  if (v === "TARJETA_CREDITO" || v === "TARJETA_DEBITO") return "TARJETA";
  return v;
}

type Props = {
  value: MedioPagoValue;
  onChange: (v: MedioPagoValue) => void;
  mostrarCuotas?: boolean;
  cuotas?: string;
  onCuotasChange?: (v: string) => void;
};

export function SelectorMedioPago({ value, onChange, mostrarCuotas, cuotas, onCuotasChange }: Props) {
  const principal = principalDe(value);

  function cambiarPrincipal(p: string) {
    if (p === "TARJETA") {
      onChange("TARJETA_DEBITO");
    } else {
      onChange(p as MedioPagoValue);
    }
  }

  function cambiarTipoTarjeta(t: string) {
    onChange(t === "CREDITO" ? "TARJETA_CREDITO" : "TARJETA_DEBITO");
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <select
        className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
        value={principal}
        onChange={(e) => cambiarPrincipal(e.target.value)}
      >
        <option value="EFECTIVO">Efectivo</option>
        <option value="TRANSFERENCIA">Transferencia</option>
        <option value="TARJETA">Tarjeta</option>
      </select>

      {principal === "TARJETA" && (
        <select
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          value={value === "TARJETA_CREDITO" ? "CREDITO" : "DEBITO"}
          onChange={(e) => cambiarTipoTarjeta(e.target.value)}
        >
          <option value="DEBITO">Débito</option>
          <option value="CREDITO">Crédito</option>
        </select>
      )}

      {mostrarCuotas && value === "TARJETA_CREDITO" && onCuotasChange && (
        <select
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          value={cuotas ?? ""}
          onChange={(e) => onCuotasChange(e.target.value)}
        >
          <option value="">Cuotas</option>
          <option value="1">1 pago</option>
          <option value="2">2 cuotas</option>
          <option value="3">3 cuotas</option>
          <option value="6">6 cuotas</option>
          <option value="9">9 cuotas</option>
          <option value="12">12 cuotas</option>
          <option value="18">18 cuotas</option>
          <option value="24">24 cuotas</option>
        </select>
      )}
    </div>
  );
}