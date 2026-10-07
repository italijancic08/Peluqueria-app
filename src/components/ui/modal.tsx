"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type Props = {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  children: ReactNode;
};

export function Modal({ abierto, onCerrar, titulo, children }: Props) {
  useEffect(() => {
    if (!abierto) return;

    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCerrar();
    }
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = overflowPrevio;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
    >
      <div
        className="modal-overlay absolute inset-0 bg-[#4A3428]/40"
        onClick={onCerrar}
        aria-hidden="true"
      />
      <div className="modal-panel relative flex max-h-[90vh] w-full flex-col rounded-t-2xl bg-white shadow-xl sm:max-w-md sm:rounded-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-[#EDD9C4] px-4 py-3 sm:px-5">
          <h2 className="text-base font-semibold text-[#4A3428] font-[family-name:var(--font-display)]">
            {titulo}
          </h2>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9C8577] transition-colors hover:bg-[#F6E4D3]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-5">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}