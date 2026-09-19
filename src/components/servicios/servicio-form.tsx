"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { servicioSchema, type ServicioFormValues } from "@/lib/validations/service";
import { crearServicio, actualizarServicio } from "@/actions/services";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RUTAS } from "@/constants/routes";
import type { Service } from "@/types/models";

type ServicioFormProps =
  | { modo: "crear" }
  | { modo: "editar"; servicio: Service };

export function ServicioForm(props: ServicioFormProps) {
  const router = useRouter();
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const valoresIniciales: ServicioFormValues =
    props.modo === "editar"
      ? {
          nombre: props.servicio.nombre,
          descripcion: props.servicio.descripcion ?? "",
          precio: Number(props.servicio.precio),
          duracion_min: props.servicio.duracion_min,
          cupo_maximo: props.servicio.cupo_maximo ?? null,
        }
      : { nombre: "", descripcion: "", precio: 0, duracion_min: 30, cupo_maximo: null };

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ServicioFormValues>({
    resolver: zodResolver(servicioSchema),
    defaultValues: valoresIniciales,
  });

  async function onSubmit(valores: ServicioFormValues) {
    setErrorGeneral(null);

    const resultado =
      props.modo === "crear"
        ? await crearServicio(valores)
        : await actualizarServicio(props.servicio.id, valores);

    if (!resultado.ok) {
      setErrorGeneral(resultado.error);
      if (resultado.fieldErrors) {
        for (const [campo, mensajes] of Object.entries(resultado.fieldErrors)) {
          if (mensajes?.[0]) {
            setError(campo as keyof ServicioFormValues, { message: mensajes[0] });
          }
        }
      }
      return;
    }

    router.push(RUTAS.servicios);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
      {errorGeneral && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {errorGeneral}
        </div>
      )}

      <div className="space-y-1">
        <label className="text-sm font-medium text-neutral-700">Nombre</label>
        <Input {...register("nombre")} />
        {errors.nombre && (
          <p className="text-xs text-red-600">{errors.nombre.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-neutral-700">
          Descripción (opcional)
        </label>
        <Textarea rows={2} {...register("descripcion")} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-neutral-700">Precio ($)</label>
          <Input
            type="number"
            step="0.01"
            min="0"
            {...register("precio", { valueAsNumber: true })}
          />
          {errors.precio && (
            <p className="text-xs text-red-600">{errors.precio.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-neutral-700">
            Duración (minutos)
          </label>
          <Input
            type="number"
            step="5"
            min="5"
            {...register("duracion_min", { valueAsNumber: true })}
          />
          {errors.duracion_min && (
            <p className="text-xs text-red-600">{errors.duracion_min.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1 max-w-xs">
        <label className="text-sm font-medium text-neutral-700">
          Cupo simultáneo (opcional)
        </label>
        <Input
          type="number"
          min="1"
          placeholder="Sin límite propio"
          {...register("cupo_maximo", {
            setValueAs: (v) => (v === "" || v == null ? null : Number(v)),
          })}
        />
        <p className="text-xs text-neutral-500">
          Dejalo vacío para usar la capacidad general del negocio. Poné 1 si este
          servicio no puede hacerse en simultáneo con otro igual (ej: Corte).
        </p>
        {errors.cupo_maximo && (
          <p className="text-xs text-red-600">{errors.cupo_maximo.message}</p>
        )}
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Guardando..."
            : props.modo === "crear"
            ? "Crear servicio"
            : "Guardar cambios"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}