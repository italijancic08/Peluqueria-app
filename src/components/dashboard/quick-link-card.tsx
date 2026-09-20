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
      className="flex items-center gap-3 rounded-xl border border-[#EDD9C4] bg-[#F3E5D6] p-4 transition-colors hover:bg-[#E8C7A6]"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white">
        <Icon className="h-5 w-5 text-[#6B4635]" />
      </span>
      <div>
        <p className="text-sm font-medium text-[#4A3428]">{label}</p>
        <p className="text-xs text-[#9C8577]">{descripcion}</p>
      </div>
    </Link>
  );
}