"use client";

import { logout } from "@/actions/auth";
import { Button } from "@/components/ui/button";

export function Topbar({ nombre }: { nombre: string }) {
  const inicial = nombre.trim().charAt(0).toUpperCase() || "?";

  return (
    <header className="h-14 border-b border-[#EDD9C4] bg-white flex items-center justify-between px-6">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F3E5D6] text-[#6B4635] text-xs font-semibold">
          {inicial}
        </span>
        <span className="text-sm text-[#9C8577]">Hola, {nombre}</span>
      </div>
      <form action={logout}>
        <Button type="submit" variant="ghost">
          Cerrar sesión
        </Button>
      </form>
    </header>
  );
}