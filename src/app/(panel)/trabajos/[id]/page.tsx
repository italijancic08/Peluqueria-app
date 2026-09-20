import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/guards";
import { Badge } from "@/components/ui/badge";
import { FinalizarTrabajoForm } from "@/components/trabajos/finalizar-trabajo-form";
import { CobrarTrabajoForm } from "@/components/trabajos/cobrar-trabajo-form";
import { formatearPesos } from "@/lib/format";
import { mostrarFechaHora } from "@/lib/dates";
import { ESTADO_TRABAJO } from "@/constants/labels";

export default async function TrabajoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireAuth();
  const supabase = await createClient();

  const { data: trabajo } = await supabase
    .from("works")
    .select("*, clients(nombre, apellido, telefono)")
    .eq("id", id)
    .single();

  if (!trabajo) notFound();

  const [{ data: items }, { data: productos }, { data: pagos }] = await Promise.all([
    supabase.from("work_items").select("*, services(nombre)").eq("work_id", id),
    supabase.from("products").select("*").eq("activo", true).order("nombre"),
    supabase.from("payments").select("*").eq("work_id", id),
  ]);

  const totalPagado = (pagos ?? []).reduce((acc, p) => acc + Number(p.monto), 0);
  const saldoPendiente = Number(trabajo.total) - totalPagado;
  const esDeudaParcial = trabajo.estado === "FINALIZADO" && totalPagado > 0 && saldoPendiente > 0;

  return (
    <div className="space-y-6 max-w-lg">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Trabajo #{trabajo.numero}</h1>
          <p className="text-sm text-neutral-500">
            {trabajo.clients?.apellido}, {trabajo.clients?.nombre}
          </p>
        </div>
        <Badge
          variant={
            trabajo.estado === "COBRADO" ? "success" : esDeudaParcial ? "danger" : "neutral"
          }
        >
          {esDeudaParcial
            ? "Deuda parcial"
            : ESTADO_TRABAJO[trabajo.estado as keyof typeof ESTADO_TRABAJO]}
        </Badge>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-medium text-neutral-700">Servicios</h2>
        <div className="rounded-md border border-neutral-200 divide-y divide-neutral-100">
          {items?.map((item) => (
            <div key={item.service_id} className="flex items-center justify-between px-3 py-2 text-sm">
              <span className="text-neutral-700">{item.services?.nombre}</span>
              <span className="text-neutral-900">{formatearPesos(item.precio_snapshot)}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between text-sm font-medium pt-1">
          <span className="text-neutral-700">Total</span>
          <span className="text-neutral-900">{formatearPesos(trabajo.total)}</span>
        </div>
      </div>

      {pagos && pagos.length > 0 && (
        <div className="space-y-1">
          <h2 className="text-sm font-medium text-neutral-700">Pagos registrados</h2>
          {pagos.map((p) => (
            <p key={p.id} className="text-sm text-neutral-600">
              {formatearPesos(p.monto)} — {p.metodo}
            </p>
          ))}
          {esDeudaParcial && (
            <p className="text-sm font-medium text-red-600 pt-1">
              Saldo pendiente: {formatearPesos(saldoPendiente)}
            </p>
          )}
        </div>
      )}

      {trabajo.estado === "TOMADO" && (
        <div className="pt-4 border-t border-neutral-200">
          <h2 className="text-sm font-medium text-neutral-700 mb-2">Finalizar trabajo</h2>
          <FinalizarTrabajoForm id={trabajo.id} productos={productos ?? []} />
        </div>
      )}

      {trabajo.estado === "FINALIZADO" && (
        <div className="pt-4 border-t border-neutral-200">
          <h2 className="text-sm font-medium text-neutral-700 mb-2">
            {esDeudaParcial ? "Registrar el resto del pago" : "Cobrar"}
          </h2>
          <CobrarTrabajoForm id={trabajo.id} saldoPendiente={saldoPendiente} />
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-neutral-400">Creado el {mostrarFechaHora(trabajo.created_at)}</p>
        <a href={`/api/documentos/${trabajo.id}`} className="text-sm text-[#6B4635] underline" download>
          Descargar comprobante (PDF)
        </a>
      </div>
    </div>
  );
}