"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { empleadoSchema, type EmpleadoFormValues } from "@/lib/validations/employee";
import { crearEmpleado } from "@/actions/employees";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RUTAS } from "@/constants/routes";

export function EmpleadoForm() {
  const router = useRouter();
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EmpleadoFormValues>({
    resolver: zodResolver(empleadoSchema),
    defaultValues: { nombre: "", apellido: "", email: "", telefono: "", rol: "EMPLEADO", comision_pct: 40, password: "" },
  });

  async function onSubmit(valores: EmpleadoFormValues) {
    setErrorGeneral(null);

    const resultado = await crearEmpleado(valores);

    if (!resultado.ok) {
      setErrorGeneral(resultado.error);
      if (resultado.fieldErrors) {
        for (const [campo, mensajes] of Object.entries(resultado.fieldErrors)) {
          if (mensajes?.[0]) {
            setError(campo as keyof EmpleadoFormValues, { message: mensajes[0] });
          }
        }
      }
      return;
    }

    router.push(RUTAS.empleados);
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
          {errors.nombre && <p className="text-xs text-red-600">{errors.nombre.message}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-neutral-700">Apellido</label>
          <Input {...register("apellido")} />
          {errors.apellido && <p className="text-xs text-red-600">{errors.apellido.message}</p>}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-neutral-700">Email</label>
        <Input type="email" {...register("email")} />
        {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-neutral-700">Teléfono (opcional)</label>
        <Input {...register("telefono")} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-neutral-700">Rol</label>
          <select
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            {...register("rol")}
          >
            <option value="EMPLEADO">Empleado</option>
            <option value="ADMIN">Administrador</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-neutral-700">Comisión (%)</label>
          <Input
            type="number"
            step="0.01"
            min="0"
            max="100"
            {...register("comision_pct", { valueAsNumber: true })}
          />
          {errors.comision_pct && (
            <p className="text-xs text-red-600">{errors.comision_pct.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-neutral-700">Contraseña inicial</label>
        <Input type="text" {...register("password")} />
        <p className="text-xs text-neutral-500">
          Se la vas a tener que pasar vos al empleado. Después puede cambiarla desde su cuenta (cuando armemos esa opción).
        </p>
        {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creando..." : "Crear empleado"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}