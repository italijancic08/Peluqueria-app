import { Button } from "@/components/ui/button";
import { formatearPesos } from "@/lib/format";
import { precioTarjeta } from "@/lib/precios";
import { resolverElegidos, type Variantes } from "@/lib/seleccion";
import type { ServiceWithVariants } from "@/types/models";

type Props = {
  servicios: ServiceWithVariants[];
  servicioIds: string[];
  variantes: Variantes;
  recargoPct: number;
  onContinuar: () => void;
};

export function ResumenSeleccion({ servicios, servicioIds, variantes, recargoPct, onContinuar }: Props) {
  const { items, faltantes } = resolverElegidos(servicios, servicioIds, variantes);
  const totalEfectivo = items.reduce((acc, i) => acc + i.precio, 0);
  const completo = servicioIds.length > 0 && faltantes.length === 0;

  return (
    <div className="rounded-xl border border-[#EDD9C4] bg-white p-4 space-y-3">
      {servicioIds.length === 0 ? (
        <p className="text-sm text-[#9C8577]">Elegí al menos un servicio para continuar.</p>
      ) : (
        <div className="space-y-1">
          {items.map((i) => (
            <div key={i.servicio.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-[#4A3428]">{i.nombre}</span>
              <span className="text-right text-xs text-[#9C8577]">
                Efectivo/transf. {formatearPesos(i.precio)} · Tarjeta{" "}
                {formatearPesos(precioTarjeta(i.precio, recargoPct))}
              </span>
            </div>
          ))}

          {faltantes.length > 0 && (
            <p className="text-sm text-[#B1543A]">
              Elegí una opción para: {faltantes.map((s) => s.nombre).join(", ")}.
            </p>
          )}

          {items.length > 0 && (
            <div className="space-y-1 border-t border-[#F3E5D6] pt-2 text-sm font-semibold text-[#4A3428]">
              <div className="flex items-center justify-between">
                <span>Total efectivo / transferencia</span>
                <span>{formatearPesos(totalEfectivo)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Total con tarjeta (+{recargoPct}%)</span>
                <span>{formatearPesos(precioTarjeta(totalEfectivo, recargoPct))}</span>
              </div>
              <p className="pt-1 text-xs font-normal text-[#9C8577]">
                El precio final depende de cómo abones: efectivo/transferencia o tarjeta.
              </p>
            </div>
          )}
        </div>
      )}
      <Button className="w-full" disabled={!completo} onClick={onContinuar}>
        Continuar
      </Button>
    </div>
  );
}