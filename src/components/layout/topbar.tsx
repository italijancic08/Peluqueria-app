"use client";

import { logout } from "@/actions/auth";
import { Button } from "@/components/ui/button";

export function Topbar({ nombre }: { nombre: string }) {
  return (
    <header className="h-14 border-b border-[#EDD9C4] bg-white flex items-center justify-between px-6">
      <span className="text-sm text-[#9C8577]">Hola, {nombre}</span>
      <form action={logout}>
        <Button type="submit" variant="ghost">
          Cerrar sesión
        </Button>
      </form>
    </header>
  );
}