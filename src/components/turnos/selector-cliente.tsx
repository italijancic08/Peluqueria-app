"use client";

import { useState } from "react";
import { buscarClientes } from "@/actions/clients";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Client } from "@/types/models";

type Props = {
  value: Client | null;
  onChange: (cliente: Client | null) => void;
};

export function SelectorCliente({ value, onChange }: Props) {
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<Client[]>([]);
  const [buscando, setBuscando] = useState(false);

  async function buscar() {
    setBuscando(true);
    const res = await buscarClientes(query);
    setBuscando(false);
    if (res.ok) setResultados(res.data);
  }

  if (value) {
    return (
      <div className="flex items-center justify-between rounded-md border border-neutral-200 px-3 py-2 text-sm">
        <span>{value.apellido}, {value.nombre} — {value.telefono}</span>
        <Button type="button" variant="ghost" onClick={() => onChange(null)}>
          Cambiar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder="Buscar por nombre o teléfono"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button type="button" variant="secondary" onClick={buscar} disabled={buscando}>
          Buscar
        </Button>
      </div>
      {resultados.length > 0 && (
        <div className="space-y-1">
          {resultados.map((c) => (
            <button
              type="button"
              key={c.id}
              onClick={() => { onChange(c); setResultados([]); }}
              className="block w-full text-left rounded-md border border-neutral-200 px-3 py-2 text-sm hover:bg-neutral-50"
            >
              {c.apellido}, {c.nombre} — {c.telefono}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}