import Link from "next/link";
import { navParaRol } from "./nav-items";
import type { UserRole } from "@/types/models";

export function Sidebar({ rol }: { rol: UserRole }) {
  const items = navParaRol(rol);

  return (
    <aside className="w-56 shrink-0 border-r border-neutral-200 bg-white p-4">
      <div className="mb-6 px-2">
        <span className="text-sm font-semibold text-neutral-900">
          Peluquería
        </span>
      </div>
      <nav className="space-y-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-md px-2 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}