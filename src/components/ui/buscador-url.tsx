"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Buscador } from "@/components/ui/buscador";
import { useDebounce } from "@/lib/use-debounce";

type Props = {
  valorInicial?: string;
  placeholder?: string;
  className?: string;
};

/**
 * Buscador para páginas que filtran en el servidor con ?q=...
 * Actualiza la URL solo cuando el usuario deja de escribir.
 */
export function BuscadorUrl({ valorInicial = "", placeholder, className }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [valor, setValor] = useState(valorInicial);
  const debounced = useDebounce(valor, 300);
  const ultimo = useRef(valorInicial.trim());

  useEffect(() => {
    const q = debounced.trim();
    if (q === ultimo.current) return;
    ultimo.current = q;
    router.replace(q ? `${pathname}?q=${encodeURIComponent(q)}` : pathname, { scroll: false });
  }, [debounced, pathname, router]);

  return (
    <Buscador value={valor} onChange={setValor} placeholder={placeholder} className={className} />
  );
}