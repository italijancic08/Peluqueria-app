import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: string;
  icon: LucideIcon;
  tono?: "neutral" | "alerta";
};

export function StatCard({ label, value, icon: Icon, tono = "neutral" }: Props) {
  return (
    <div className="rounded-xl border border-[#EDD9C4] bg-white p-4 flex items-center gap-3">
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
          tono === "alerta" ? "bg-[#F7E9E2]" : "bg-[#F3E5D6]"
        )}
      >
        <Icon className={cn("h-5 w-5", tono === "alerta" ? "text-[#B1543A]" : "text-[#6B4635]")} />
      </span>
      <div>
        <p className="text-xs text-[#9C8577]">{label}</p>
        <p className="text-lg font-semibold text-[#4A3428]">{value}</p>
      </div>
    </div>
  );
}