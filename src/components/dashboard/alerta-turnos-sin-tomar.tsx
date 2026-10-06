import Link from "next/link";
import { TriangleAlert } from "lucide-react";

type Props = {
  cantidad: number;
  avisoMin: number;
};

export function AlertaTurnosSinTomar({ cantidad, avisoMin }: Props) {
  if (cantidad === 0) return null;

  return (
    <Link
      href="/trabajos/disponibles"
      className="flex items-center gap-3 rounded-xl border border-[#E8C7A6] bg-[#FBF0DC] p-4 transition-colors hover:bg-[#F6E4D3]"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/70">
        <TriangleAlert className="h-5 w-5 text-[#A8741F]" />
      </span>
      <div>
        <p className="text-sm font-medium text-[#4A3428]">
          {cantidad === 1
            ? "1 turno sin tomar"
            : `${cantidad} turnos sin tomar`}
        </p>
        <p className="text-xs text-[#9C8577]">
          Empiezan en menos de {avisoMin} min (o ya están demorados). Tocá para tomarlos.
        </p>
      </div>
    </Link>
  );
}