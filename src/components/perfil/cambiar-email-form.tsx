"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cambiarEmailSchema, type CambiarEmailValues } from "@/lib/validations/account";
import { cambiarEmailPropio } from "@/actions/profile";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function CambiarEmailForm({ emailActual }: { emailActual: string }) {
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CambiarEmailValues>({
    resolver: zodResolver(cambiarEmailSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(valores: CambiarEmailValues) {
    setError(null);
    setMensaje(null);

    const resultado = await cambiarEmailPropio(valores);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }

    setMensaje(
      "Te enviamos un correo de confirmación al nuevo email. El cambio se hace efectivo cuando lo confirmes."
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <p className="text-sm text-[#9C8577]">Email actual: {emailActual}</p>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {mensaje && <p className="text-sm text-green-700">{mensaje}</p>}

      <div className="space-y-1">
        <label className="text-sm font-medium text-[#4A3428]">Nuevo email</label>
        <Input type="email" {...register("email")} />
        {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Enviando..." : "Cambiar email"}
      </Button>
    </form>
  );
}