"use client";

import { logout } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { MobileNav } from "./mobile-nav";
import type { UserRole } from "@/types/models";

type Props = {
  nombre: string;
  fotoUrl: string | null;
  rol: UserRole;
};

export function Topbar({ nombre, fotoUrl, rol }: Props) {
  const inicial = nombre.trim().charAt(0).toUpperCase() || "?";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-[#EDD9C4] bg-white px-3 sm:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <MobileNav rol={rol} nombre={nombre} />
        {fotoUrl ? (
          <img src={fotoUrl} alt={nombre} className="h-8 w-8 shrink-0 rounded-full object-cover" />
        ) : (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F3E5D6] text-[#6B4635] text-xs font-semibold">
            {inicial}
          </span>
        )}
        <span className="truncate text-sm text-[#9C8577]">Hola, {nombre}</span>
      </div>
      <form action={logout} className="hidden lg:block">
        <Button type="submit" variant="ghost">
          Cerrar sesión
        </Button>
      </form>
    </header>
  );
}