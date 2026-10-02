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

type ServicioFormProps = { modo: "crear" } | { modo: "editar"; servicio: Service };

function valoresParaServicio(props: ServicioFormProps): ServicioFormValues {
  if (props.modo === "editar") {
    const s = props.servicio;
    return {
      nombre: s.nombre,
      descripcion: s.descripcion ?? "",
      precio: Number(s.precio),
      duracion_min: s.duracion_min,
      cupo_maximo: s.cupo_maximo ?? null,
      tiene_ficha_tecnica: s.tiene_ficha_tecnica,
    };
  }
  return {
    nombre: "",
    descripcion: "",
    precio: 0,
    duracion_min: 30,
    cupo_maximo: null,
    tiene_ficha_tecnica: false,
  };
}

export function ServicioForm(props: ServicioFormProps) {
  const router = useRouter();
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [unidadDuracion, setUnidadDuracion] = useState<"MIN" | "HORAS">("MIN");

  const duracionInicial = props.modo === "editar" ? String(props.servicio.duracion_min) : "30";
  const [duracionInput, setDuracionInput] = useState(duracionInicial);

  const valoresIniciales = valoresParaServicio(props);

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ServicioFormValues>({
    resolver: zodResolver(servicioSchema),
    defaultValues: valoresIniciales,
  });

  function actualizarDuracion(valor: string, unidad: "MIN" | "HORAS") {
    setDuracionInput(valor);
    const numero = Number(valor);
    if (!isNaN(numero)) {
      const minutos = unidad === "HORAS" ? Math.round(numero * 60) : Math.round(numero);
      setValue("duracion_min", minutos, { shouldValidate: true });
    }
  }

  function cambiarUnidad(nuevaUnidad: "MIN" | "HORAS") {
    setUnidadDuracion(nuevaUnidad);
    actualizarDuracion(duracionInput, nuevaUnidad);
  }

  async function onSubmit(valores: ServicioFormValues) {
    setErrorGeneral(null);

    const resultado =
      props.modo === "crear"
        ? await crearServicio(valores)
        : await actualizarServicio(props.servicio.id, valores);

    if (!resultado.ok) {
      setErrorGeneral(resultado.error);
      if (resultado.fieldErrors) {
        for (const campo in resultado.fieldErrors) {
          const mensajes = resultado.fieldErrors[campo];
          if (mensajes && mensajes[0]) {
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
        {errors.nombre && <p className="text-xs text-red-600">{errors.nombre.message}</p>}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-neutral-700">Descripción (opcional)</label>
        <Textarea rows={2} {...register("descripcion")} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-neutral-700">Precio ($)</label>
          <Input type="number" step="0.01" min="0" {...register("precio", { valueAsNumber: true })} />
          {errors.precio && <p className="text-xs text-red-600">{errors.precio.message}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-neutral-700">Duración</label>
          <div className="flex gap-2">
            <Input
              type="number"
              step={unidadDuracion === "HORAS" ? "0.5" : "5"}
              min={unidadDuracion === "HORAS" ? "0.5" : "5"}
              value={duracionInput}
              onChange={(e) => actualizarDuracion(e.target.value, unidadDuracion)}
            />
            <select
              className="rounded-md border border-neutral-300 px-2 text-sm"
              value={unidadDuracion}
              onChange={(e) => cambiarUnidad(e.target.value as "MIN" | "HORAS")}
            >
              <option value="MIN">min</option>
              <option value="HORAS">hs</option>
            </select>
          </div>
          {errors.duracion_min && <p className="text-xs text-red-600">{errors.duracion_min.message}</p>}
        </div>
      </div>

      <div className="space-y-1 max-w-xs">
        <label className="text-sm font-medium text-neutral-700">Cupo simultáneo (opcional)</label>
        <Input
          type="number"
          min="1"
          placeholder="Sin límite propio"
          {...register("cupo_maximo", {
            setValueAs: (v) => (v === "" || v == null ? null : Number(v)),
          })}
        />
        <p className="text-xs text-neutral-500">
          Dejalo vacío para usar la capacidad general del negocio. Poné 1 si este servicio no puede
          hacerse en simultáneo con otro igual (ej: Corte).
        </p>
        {errors.cupo_maximo && <p className="text-xs text-red-600">{errors.cupo_maximo.message}</p>}
      </div>

      <label className="flex items-center gap-2 text-sm text-neutral-700">
        <input type="checkbox" {...register("tiene_ficha_tecnica")} />
        Este servicio tiene ficha técnica
      </label>
      <p className="text-xs text-neutral-500 -mt-3">
        Si lo activás, al finalizar un trabajo con este servicio el empleado va a poder anotar
        detalles (fórmula usada, tiempos, etc.), y va a quedar guardado en la ficha del cliente.
      </p>

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : props.modo === "crear" ? "Crear servicio" : "Guardar cambios"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}