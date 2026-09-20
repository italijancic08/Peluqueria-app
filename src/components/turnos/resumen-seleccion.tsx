import { Button } from "@/components/ui/button";
import { formatearPesos } from "@/lib/format";
import type { Service } from "@/types/models";

type Props = {
  servicios: Service[];
  servicioIds: string[];
  onContinuar: () => void;
};

export function ResumenSeleccion({ servicios, servicioIds, onContinuar }: Props) {
  const elegidos = servicios.filter((s) => servicioIds.includes(s.id));
  const total = elegidos.reduce((acc, s) => acc + Number(s.precio), 0);

  return (
    <div className="rounded-xl border border-[#EDD9C4] bg-white p-4 space-y-3">
      {elegidos.length === 0 ? (
        <p className="text-sm text-[#9C8577]">Elegí al menos un servicio para continuar.</p>
      ) : (
        <div className="space-y-1">
          {elegidos.map((s) => (
            <div key={s.id} className="flex items-center justify-between text-sm">
              <span className="text-[#4A3428]">{s.nombre}</span>
              <span className="text-[#9C8577]">{formatearPesos(s.precio)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between text-sm font-semibold pt-2 border-t border-[#F3E5D6]">
            <span className="text-[#4A3428]">Total</span>
            <span className="text-[#4A3428]">{formatearPesos(total)}</span>
          </div>
        </div>
      )}
      <Button className="w-full" disabled={elegidos.length === 0} onClick={onContinuar}>
        Continuar
      </Button>
    </div>
  );
}