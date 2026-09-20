"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Scissors } from "lucide-react";
import { navParaRol } from "./nav-items";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/models";

export function Sidebar({ rol }: { rol: UserRole }) {
  const pathname = usePathname();
  const items = navParaRol(rol);
  const primerIndiceAdmin = items.findIndex((item) => item.soloAdmin);

  return (
    <aside className="w-60 shrink-0 bg-white border-r border-[#EDD9C4] p-4 flex flex-col">
      <div className="mb-6 px-2 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#6B4635]">
          <Scissors className="h-4 w-4 text-white" />
        </span>
        <span className="text-sm font-semibold text-[#4A3428] font-[family-name:var(--font-display)]">
          Peluquería
        </span>
      </div>
      <nav className="space-y-1">
        {items.map((item, index) => {
          const activo = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <div key={item.href}>
              {index === primerIndiceAdmin && (
                <div className="my-2 border-t border-dashed border-[#EDD9C4]" />
              )}
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  activo
                    ? "bg-[#6B4635] text-white font-medium"
                    : "text-[#9C8577] hover:bg-[#F6E4D3] hover:text-[#4A3428]"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}