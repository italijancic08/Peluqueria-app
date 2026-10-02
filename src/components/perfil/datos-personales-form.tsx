"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { datosPersonalesSchema, type DatosPersonalesValues } from "@/lib/validations/account";
import { actualizarDatosPersonales } from "@/actions/profile";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/types/models";

export function DatosPersonalesForm({ perfil }: { perfil: Profile }) {
  const router = useRouter();
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DatosPersonalesValues>({
    resolver: zodResolver(datosPersonalesSchema),
    defaultValues: {
      nombre: perfil.nombre,
      apellido: perfil.apellido,
      telefono: perfil.telefono ?? "",
    },
  });

  async function onSubmit(valores: DatosPersonalesValues) {
    setError(null);
    setMensaje(null);

    const resultado = await actualizarDatosPersonales(valores);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }

    setMensaje("Datos actualizados.");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {mensaje && <p className="text-sm text-green-700">{mensaje}</p>}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-sm font-medium text-[#4A3428]">Nombre</label>
          <Input {...register("nombre")} />
          {errors.nombre && <p className="text-xs text-red-600">{errors.nombre.message}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-[#4A3428]">Apellido</label>
          <Input {...register("apellido")} />
          {errors.apellido && <p className="text-xs text-red-600">{errors.apellido.message}</p>}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-[#4A3428]">Teléfono (opcional)</label>
        <Input {...register("telefono")} />
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Guardando..." : "Guardar datos"}
      </Button>
    </form>
  );
}