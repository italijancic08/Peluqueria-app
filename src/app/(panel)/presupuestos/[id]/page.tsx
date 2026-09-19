import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { EstadoPresupuestoActions } from "@/components/presupuestos/estado-presupuesto-actions";
import { formatearPesos } from "@/lib/format";
import { mostrarFechaHora } from "@/lib/dates";
import { ESTADO_PRESUPUESTO } from "@/constants/labels";

export default async function PresupuestoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: presupuesto } = await supabase
    .from("budgets")
    .select("*, clients(nombre, apellido, telefono)")
    .eq("id", id)
    .single();

  if (!presupuesto) notFound();

  const { data: items } = await supabase
    .from("budget_items")
    .select("*, services(nombre)")
    .eq("budget_id", id);

  return (
    <div className="space-y-6 max-w-lg">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">
            Presupuesto #{presupuesto.numero}
          </h1>
          <p className="text-sm text-neutral-500">
            {presupuesto.clients?.apellido}, {presupuesto.clients?.nombre}
          </p>
        </div>
        <Badge
          variant={
            presupuesto.estado === "ACEPTADO"
              ? "success"
              : presupuesto.estado === "RECHAZADO"
              ? "danger"
              : "neutral"
          }
        >
          {ESTADO_PRESUPUESTO[presupuesto.estado as keyof typeof ESTADO_PRESUPUESTO]}
        </Badge>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-medium text-neutral-700">Servicios</h2>
        <div className="rounded-md border border-neutral-200 divide-y divide-neutral-100">
          {items?.map((item) => (
            <div
              key={item.service_id}
              className="flex items-center justify-between px-3 py-2 text-sm"
            >
              <span className="text-neutral-700">{item.services?.nombre}</span>
              <span className="text-neutral-900">{formatearPesos(item.precio_snapshot)}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between text-sm font-medium pt-1">
          <span className="text-neutral-700">Total</span>
          <span className="text-neutral-900">{formatearPesos(presupuesto.total)}</span>
        </div>
      </div>

      {presupuesto.notas && (
        <div>
          <h2 className="text-sm font-medium text-neutral-700 mb-1">Notas</h2>
          <p className="text-sm text-neutral-600 whitespace-pre-wrap">{presupuesto.notas}</p>
        </div>
      )}

      <p className="text-xs text-neutral-400">
        Creado el {mostrarFechaHora(presupuesto.created_at)}
      </p>

      {presupuesto.estado === "PENDIENTE" && (
        <div className="pt-2 border-t border-neutral-200">
          <h2 className="text-sm font-medium text-neutral-700 mb-2">Decisión del cliente</h2>
          <EstadoPresupuestoActions id={presupuesto.id} />
        </div>
      )}
    </div>
  );
}