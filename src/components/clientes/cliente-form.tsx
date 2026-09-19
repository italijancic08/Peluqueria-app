"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clienteSchema, type ClienteFormValues } from "@/lib/validations/client";
import { crearCliente, actualizarCliente } from "@/actions/clients";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RUTAS } from "@/constants/routes";
import type { Client } from "@/types/models";

type ClienteFormProps =
  | { modo: "crear" }
  | { modo: "editar"; cliente: Client };

export function ClienteForm(props: ClienteFormProps) {
  const router = useRouter();
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const valoresIniciales: ClienteFormValues =
    props.modo === "editar"
      ? {
          nombre: props.cliente.nombre,
          apellido: props.cliente.apellido,
          telefono: props.cliente.telefono,
          dni: props.cliente.dni ?? "",
          email: props.cliente.email ?? "",
          notas: props.cliente.notas ?? "",
        }
      : { nombre: "", apellido: "", telefono: "", dni: "", email: "", notas: "" };

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema),
    defaultValues: valoresIniciales,
  });

  async function onSubmit(valores: ClienteFormValues) {
    setErrorGeneral(null);

    const resultado =
      props.modo === "crear"
        ? await crearCliente(valores)
        : await actualizarCliente(props.cliente.id, valores);

    if (!resultado.ok) {
      setErrorGeneral(resultado.error);
      if (resultado.fieldErrors) {
        for (const [campo, mensajes] of Object.entries(resultado.fieldErrors)) {
          if (mensajes?.[0]) {
            setError(campo as keyof ClienteFormValues, { message: mensajes[0] });
          }
        }
      }
      return;
    }

    const idDestino = props.modo === "crear" ? resultado.data.id : props.cliente.id;
    router.push(RUTAS.cliente(idDestino));
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
      {errorGeneral && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {errorGeneral}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-neutral-700">Nombre</label>
          <Input {...register("nombre")} />
          {errors.nombre && (
            <p className="text-xs text-red-600">{errors.nombre.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-neutral-700">Apellido</label>
          <Input {...register("apellido")} />
          {errors.apellido && (
            <p className="text-xs text-red-600">{errors.apellido.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-neutral-700">Teléfono</label>
        <Input {...register("telefono")} placeholder="Ej: 3482 123456" />
        {errors.telefono && (
          <p className="text-xs text-red-600">{errors.telefono.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-neutral-700">DNI (opcional)</label>
          <Input {...register("dni")} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-neutral-700">Email (opcional)</label>
          <Input type="email" {...register("email")} />
          {errors.email && (
            <p className="text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-neutral-700">Notas (opcional)</label>
        <Textarea rows={3} {...register("notas")} />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Guardando..."
            : props.modo === "crear"
            ? "Crear cliente"
            : "Guardar cambios"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}