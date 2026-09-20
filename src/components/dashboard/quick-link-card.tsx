import Link from "next/link";
import { type LucideIcon } from "lucide-react";

type Props = {
  href: string;
  label: string;
  descripcion: string;
  icon: LucideIcon;
};

export function QuickLinkCard({ href, label, descripcion, icon: Icon }: Props) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-[#6B4635] bg-[#6B4635] p-4 transition-colors hover:bg-[#5A3A2C]"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15">
        <Icon className="h-5 w-5 text-white" />
      </span>
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-[#E8D9CC]">{descripcion}</p>
      </div>
    </Link>
  );
}