"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { navParaRol } from "./nav-items";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/models";

export function Sidebar({ rol }: { rol: UserRole }) {
  const pathname = usePathname();
  const items = navParaRol(rol);
  const primerIndiceAdmin = items.findIndex((item) => item.soloAdmin);

  return (
    <aside className="w-60 shrink-0 h-screen sticky top-0 bg-white border-r border-[#EDD9C4] p-3 flex flex-col">
      <div className="mb-3 px-1">
        <Image
          src="/logo.png"
          alt="Estefanía Martyn"
          width={200}
          height={80}
          className="w-full h-auto max-h-30 object-contain"
          priority
        />
      </div>
      <nav className="space-y-0.5 text-sm">
        {items.map((item, index) => {
          const activo = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <div key={item.href}>
              {index === primerIndiceAdmin && (
                <div className="my-1 border-t border-dashed border-[#EDD9C4]" />
              )}
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 transition-colors",
                  activo
                    ? "bg-[#6B4635] text-white font-medium"
                    : "text-[#9C8577] hover:bg-[#F6E4D3] hover:text-[#4A3428]"
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {item.label}
              </Link>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}