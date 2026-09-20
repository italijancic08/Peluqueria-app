"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productoSchema, type ProductoFormValues } from "@/lib/validations/product";
import { crearProducto, actualizarProducto } from "@/actions/stock";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RUTAS } from "@/constants/routes";
import { UNIDAD } from "@/constants/labels";
import type { Product } from "@/types/models";

type ProductoFormProps =
  | { modo: "crear" }
  | { modo: "editar"; producto: Product };

export function ProductoForm(props: ProductoFormProps) {
  const router = useRouter();
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const valoresIniciales: ProductoFormValues =
    props.modo === "editar"
      ? {
          nombre: props.producto.nombre,
          categoria: props.producto.categoria ?? "",
          unidad: props.producto.unidad,
          stock_minimo: Number(props.producto.stock_minimo),
          costo: props.producto.costo ?? null,
        }
      : { nombre: "", categoria: "", unidad: "UNIDAD", stock_minimo: 0, costo: null };

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProductoFormValues>({
    resolver: zodResolver(productoSchema),
    defaultValues: valoresIniciales,
  });

  async function onSubmit(valores: ProductoFormValues) {
    setErrorGeneral(null);

    const resultado =
      props.modo === "crear"
        ? await crearProducto(valores)
        : await actualizarProducto(props.producto.id, valores);

    if (!resultado.ok) {
      setErrorGeneral(resultado.error);
      if (resultado.fieldErrors) {
        for (const [campo, mensajes] of Object.entries(resultado.fieldErrors)) {
          if (mensajes?.[0]) {
            setError(campo as keyof ProductoFormValues, { message: mensajes[0] });
          }
        }
      }
      return;
    }

    router.push(RUTAS.stock);
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
        <label className="text-sm font-medium text-neutral-700">Categoría (opcional)</label>
        <Input {...register("categoria")} placeholder="Ej: Tinturas" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-neutral-700">Unidad</label>
          <select
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            {...register("unidad")}
          >
            {Object.entries(UNIDAD).map(([valor, label]) => (
              <option key={valor} value={valor}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-neutral-700">Stock mínimo</label>
          <Input
            type="number"
            step="0.001"
            min="0"
            {...register("stock_minimo", { valueAsNumber: true })}
          />
          {errors.stock_minimo && (
            <p className="text-xs text-red-600">{errors.stock_minimo.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-neutral-700">Costo (opcional)</label>
          <Input
            type="number"
            step="0.01"
            min="0"
            {...register("costo", {
              setValueAs: (v) => (v === "" || v == null ? null : Number(v)),
            })}
          />
        </div>
      </div>

      {props.modo === "editar" && (
        <p className="text-xs text-neutral-500">
          Stock actual: {Number(props.producto.cantidad_actual)} {UNIDAD[props.producto.unidad]}.
          Para corregirlo, usá un movimiento de stock en vez de editar este número.
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Guardando..."
            : props.modo === "crear"
            ? "Crear producto"
            : "Guardar cambios"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}