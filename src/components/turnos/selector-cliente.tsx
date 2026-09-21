"use client";

import { useState } from "react";
import { buscarClientes, crearCliente } from "@/actions/clients";
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

  const [creando, setCreando] = useState(false);
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [telefono, setTelefono] = useState("");
  const [errorCreacion, setErrorCreacion] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function buscar() {
    setBuscando(true);
    const res = await buscarClientes(query);
    setBuscando(false);
    if (res.ok) setResultados(res.data);
  }

  async function crear() {
    setErrorCreacion(null);

    if (!nombre.trim() || !apellido.trim() || !telefono.trim()) {
      setErrorCreacion("Completá nombre, apellido y teléfono.");
      return;
    }

    setEnviando(true);
    const resultado = await crearCliente({ nombre, apellido, telefono });
    setEnviando(false);

    if (!resultado.ok) {
      setErrorCreacion(resultado.error);
      return;
    }

    onChange(resultado.data);
    setCreando(false);
    setNombre("");
    setApellido("");
    setTelefono("");
  }

  if (value) {
    return (
      <div className="flex items-center justify-between rounded-md border border-[#EDD9C4] px-3 py-2 text-sm">
        <span>
          {value.apellido}, {value.nombre} — {value.telefono}
        </span>
        <Button type="button" variant="ghost" onClick={() => onChange(null)}>
          Cambiar
        </Button>
      </div>
    );
  }

  if (creando) {
    return (
      <div className="space-y-2 rounded-md border border-[#EDD9C4] bg-white p-3">
        {errorCreacion && <p className="text-xs text-red-600">{errorCreacion}</p>}
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          <Input placeholder="Apellido" value={apellido} onChange={(e) => setApellido(e.target.value)} />
        </div>
        <Input placeholder="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
        <div className="flex gap-2">
          <Button type="button" onClick={crear} disabled={enviando}>
            {enviando ? "Creando..." : "Crear y elegir"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setCreando(false)}>
            Cancelar
          </Button>
        </div>
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
        <div className="rounded-md border border-[#EDD9C4] bg-white divide-y divide-[#F3E5D6]">
          {resultados.map((c) => (
            <button
              type="button"
              key={c.id}
              onClick={() => {
                onChange(c);
                setResultados([]);
              }}
              className="block w-full text-left px-3 py-2 text-sm hover:bg-[#F6E4D3]"
            >
              {c.apellido}, {c.nombre} — {c.telefono}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setCreando(true)}
            className="block w-full text-left px-3 py-2 text-sm text-[#6B4635] font-medium hover:bg-[#F6E4D3]"
          >
            + Crear cliente nuevo
          </button>
        </div>
      )}

      {resultados.length === 0 && (
        <button type="button" onClick={() => setCreando(true)} className="text-sm text-[#6B4635] underline">
          + Crear cliente nuevo
        </button>
      )}
    </div>
  );
}