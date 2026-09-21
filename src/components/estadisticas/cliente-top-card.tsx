import { Crown } from "lucide-react";
import { formatearPesos } from "@/lib/format";

type Props = {
  nombre: string | null;
  total: number;
};

export function ClienteTopCard({ nombre, total }: Props) {
  return (
    <div className="rounded-xl border border-[#EDD9C4] bg-white p-4 flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F3E5D6]">
        <Crown className="h-5 w-5 text-[#6B4635]" />
      </span>
      <div>
        <p className="text-xs text-[#9C8577]">Cliente que más gastó este mes</p>
        <p className="text-lg font-semibold text-[#4A3428]">{nombre ?? "—"}</p>
        {nombre && <p className="text-sm text-[#9C8577]">{formatearPesos(total)}</p>}
      </div>
    </div>
  );
}