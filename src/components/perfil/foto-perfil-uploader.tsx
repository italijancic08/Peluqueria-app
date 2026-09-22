"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { subirFotoPerfil } from "@/actions/profile";

type Props = {
  profileId: string;
  fotoUrl: string | null;
  nombre: string;
};

export function FotoPerfilUploader({ profileId, fotoUrl, nombre }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(fotoUrl);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inicial = nombre.trim().charAt(0).toUpperCase() || "?";

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setPreview(URL.createObjectURL(file));
    setSubiendo(true);

    const formData = new FormData();
    formData.append("foto", file);

    const resultado = await subirFotoPerfil(profileId, formData);
    setSubiendo(false);

    if (!resultado.ok) {
      setError(resultado.error);
      setPreview(fotoUrl);
      return;
    }

    setPreview(resultado.data.url);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        {preview ? (
          <img
            src={preview}
            alt={nombre}
            className="h-20 w-20 rounded-full object-cover border border-[#EDD9C4]"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#F3E5D6] text-2xl font-semibold text-[#6B4635] font-[family-name:var(--font-display)]">
            {inicial}
          </div>
        )}
        {subiendo && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30 text-xs text-white">
            Subiendo...
          </div>
        )}
      </div>

      <div className="space-y-1">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-sm text-[#6B4635] underline"
          disabled={subiendo}
        >
          Cambiar foto
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleChange}
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}