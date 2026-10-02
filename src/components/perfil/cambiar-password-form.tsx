"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cambiarPasswordSchema, type CambiarPasswordValues } from "@/lib/validations/account";
import { cambiarPasswordPropia } from "@/actions/profile";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function CambiarPasswordForm() {
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CambiarPasswordValues>({
    resolver: zodResolver(cambiarPasswordSchema),
    defaultValues: { passwordActual: "", passwordNueva: "", confirmarPassword: "" },
  });

  async function onSubmit(valores: CambiarPasswordValues) {
    setError(null);
    setMensaje(null);

    const resultado = await cambiarPasswordPropia(valores);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }

    setMensaje("Contraseña actualizada.");
    reset();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {mensaje && <p className="text-sm text-green-700">{mensaje}</p>}

      <div className="space-y-1">
        <label className="text-sm font-medium text-[#4A3428]">Contraseña actual</label>
        <Input type="password" {...register("passwordActual")} />
        {errors.passwordActual && (
          <p className="text-xs text-red-600">{errors.passwordActual.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-[#4A3428]">Contraseña nueva</label>
        <Input type="password" {...register("passwordNueva")} />
        {errors.passwordNueva && (
          <p className="text-xs text-red-600">{errors.passwordNueva.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-[#4A3428]">Repetir contraseña nueva</label>
        <Input type="password" {...register("confirmarPassword")} />
        {errors.confirmarPassword && (
          <p className="text-xs text-red-600">{errors.confirmarPassword.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Cambiando..." : "Cambiar contraseña"}
      </Button>
    </form>
  );
}