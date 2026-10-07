"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { logout } from "@/actions/auth";
import { navParaRol } from "./nav-items";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/models";

type Props = {
  rol: UserRole;
  nombre: string;
};

export function MobileNav({ rol, nombre }: Props) {
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(false);
  const items = navParaRol(rol);
  const primerIndiceAdmin = items.findIndex((item) => item.soloAdmin);

  useEffect(() => {
    if (!abierto) return;

    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setAbierto(false);
    }
    function onResize() {
      if (window.innerWidth >= 1024) setAbierto(false);
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);

    return () => {
      document.body.style.overflow = overflowPrevio;
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
    };
  }, [abierto]);

  return (
    <div className="lg:hidden">
      {/* Botón hamburguesa (queda por encima del panel y se convierte en ✕) */}
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={abierto}
        aria-controls="menu-movil"
        className="relative z-[60] flex h-10 w-10 items-center justify-center rounded-lg text-[#6B4635] transition-colors hover:bg-[#F6E4D3]"
      >
        <span className="relative block h-4 w-5">
          <span
            className={cn(
              "absolute left-0 h-0.5 w-5 rounded-full bg-current transition-all duration-300",
              abierto ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0"
            )}
          />
          <span
            className={cn(
              "absolute left-0 top-1/2 h-0.5 w-5 -translate-y-1/2 rounded-full bg-current transition-all duration-300",
              abierto ? "scale-x-0 opacity-0" : "scale-x-100 opacity-100"
            )}
          />
          <span
            className={cn(
              "absolute left-0 h-0.5 w-5 rounded-full bg-current transition-all duration-300",
              abierto ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-0"
            )}
          />
        </span>
      </button>

      {/* Overlay */}
      <div
        onClick={() => setAbierto(false)}
        aria-hidden="true"
        className={cn(
          "fixed inset-0 z-40 bg-[#4A3428]/40 transition-opacity duration-300",
          abierto ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      {/* Panel lateral */}
      <aside
        id="menu-movil"
        inert={!abierto}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-[#EDD9C4] bg-white shadow-xl transition-transform duration-300 ease-out",
          abierto ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* pl-16 deja libre el lugar donde queda el botón ✕ */}
        <div className="flex h-14 shrink-0 items-center border-b border-[#EDD9C4] pl-16 pr-4">
          <Image
            src="/logo.png"
            alt="Estefanía Martyn"
            width={120}
            height={48}
            className="h-9 w-auto object-contain"
          />
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3 text-sm">
          {items.map((item, index) => {
            const activo =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <div
                key={item.href}
                style={{ transitionDelay: abierto ? `${120 + index * 30}ms` : "0ms" }}
                className={cn(
                  "transition-all duration-300",
                  abierto ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0"
                )}
              >
                {index === primerIndiceAdmin && (
                  <div className="my-1 border-t border-dashed border-[#EDD9C4]" />
                )}
                <Link
                  href={item.href}
                  onClick={() => setAbierto(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
                    activo
                      ? "bg-[#6B4635] font-medium text-white"
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

        <div className="shrink-0 border-t border-[#EDD9C4] p-3">
          <p className="truncate px-3 pb-2 text-xs text-[#9C8577]">{nombre}</p>
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#B1543A] transition-colors hover:bg-[#F7E9E2]"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>
    </div>
  );
}