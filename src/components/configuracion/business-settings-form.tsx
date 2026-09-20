"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { businessSettingsSchema, type BusinessSettingsValues } from "@/lib/validations/settings";
import { actualizarConfiguracion } from "@/actions/settings";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { BusinessSettings } from "@/types/models";

export function BusinessSettingsForm({ settings }: { settings: BusinessSettings }) {
  const router = useRouter();
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BusinessSettingsValues>({
    resolver: zodResolver(businessSettingsSchema),
    defaultValues: {
      nombre_negocio: settings.nombre_negocio,
      comision_default_pct: Number(settings.comision_default_pct),
      capacidad_simultanea: settings.capacidad_simultanea,
      intervalo_turnos_min: settings.intervalo_turnos_min,
    },
  });

  async function onSubmit(valores: BusinessSettingsValues) {
    setError(null);
    setMensaje(null);

    const resultado = await actualizarConfiguracion(valores);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }

    setMensaje("Configuración guardada.");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      {mensaje && <p className="text-sm text-green-700">{mensaje}</p>}

      <div className="space-y-1">
        <label className="text-sm font-medium text-neutral-700">Nombre del negocio</label>
        <Input {...register("nombre_negocio")} />
        {errors.nombre_negocio && (
          <p className="text-xs text-red-600">{errors.nombre_negocio.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-neutral-700">Comisión por defecto (%)</label>
        <Input
          type="number"
          step="0.01"
          min="0"
          max="100"
          {...register("comision_default_pct", { valueAsNumber: true })}
        />
        <p className="text-xs text-neutral-500">
          Se usa para empleados que no tengan una comisión particular cargada en su perfil.
        </p>
        {errors.comision_default_pct && (
          <p className="text-xs text-red-600">{errors.comision_default_pct.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-neutral-700">Capacidad simultánea</label>
          <Input
            type="number"
            min="1"
            {...register("capacidad_simultanea", { valueAsNumber: true })}
          />
          <p className="text-xs text-neutral-500">Puestos de atención al mismo tiempo.</p>
          {errors.capacidad_simultanea && (
            <p className="text-xs text-red-600">{errors.capacidad_simultanea.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-neutral-700">Intervalo entre turnos (min)</label>
          <Input
            type="number"
            step="5"
            min="5"
            {...register("intervalo_turnos_min", { valueAsNumber: true })}
          />
          <p className="text-xs text-neutral-500">Cada cuánto se ofrece un horario nuevo.</p>
          {errors.intervalo_turnos_min && (
            <p className="text-xs text-red-600">{errors.intervalo_turnos_min.message}</p>
          )}
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Guardando..." : "Guardar configuración"}
      </Button>
    </form>
  );
}