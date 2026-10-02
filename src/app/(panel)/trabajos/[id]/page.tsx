import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/guards";
import { Badge } from "@/components/ui/badge";
import { FinalizarTrabajoForm } from "@/components/trabajos/finalizar-trabajo-form";
import { CobrarTrabajoForm } from "@/components/trabajos/cobrar-trabajo-form";
import { formatearPesos } from "@/lib/format";
import { mostrarFecha, mostrarFechaHora } from "@/lib/dates";
import { ESTADO_TRABAJO, MEDIO_PAGO } from "@/constants/labels";

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
    .select("*, clients(nombre, apellido, telefono, cuenta_corriente_habilitada)")
    .eq("id", id)
    .single();

  if (!trabajo) notFound();

  const [{ data: items }, { data: productos }, { data: pagos }, { data: trabajosAnteriores }] = await Promise.all([
    supabase.from("work_items").select("*, services(nombre, tiene_ficha_tecnica)").eq("work_id", id),
    supabase.from("products").select("*").eq("activo", true).order("nombre"),
    supabase.from("payments").select("*").eq("work_id", id),
    supabase
      .from("works")
      .select("*, work_items(precio_snapshot, ficha_tecnica, services(nombre))")
      .eq("client_id", trabajo.client_id)
      .neq("id", id)
      .neq("estado", "DISPONIBLE")
      .neq("estado", "CANCELADO")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const totalPagado = (pagos ?? []).reduce((acc, p) => acc + Number(p.monto), 0);
  const saldoPendiente = Number(trabajo.total) - totalPagado;
  const esDeudaParcial = trabajo.estado === "FINALIZADO" && totalPagado > 0 && saldoPendiente > 0;

  const itemsConFicha = (items ?? [])
    .filter((it) => (it as any).services?.tiene_ficha_tecnica)
    .map((it) => ({ serviceId: it.service_id, nombre: (it as any).services?.nombre ?? "Servicio" }));

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
            <div key={item.service_id} className="px-3 py-2 text-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-neutral-700">{(item as any).services?.nombre}</span>
                <span className="text-neutral-900">{formatearPesos(item.precio_snapshot)}</span>
              </div>
              {item.ficha_tecnica && (
                <div className="rounded bg-neutral-50 px-2 py-1.5">
                  <p className="text-xs text-neutral-500 font-medium">Ficha técnica</p>
                  <p className="text-xs text-neutral-700 whitespace-pre-wrap">{item.ficha_tecnica}</p>
                </div>
              )}
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
              {formatearPesos(p.monto)} — {MEDIO_PAGO[p.metodo as keyof typeof MEDIO_PAGO] ?? p.metodo}
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
          <FinalizarTrabajoForm id={trabajo.id} productos={productos ?? []} itemsConFicha={itemsConFicha} />
        </div>
      )}

      {trabajo.estado === "FINALIZADO" && (
        <div className="pt-4 border-t border-neutral-200">
          <h2 className="text-sm font-medium text-neutral-700 mb-2">
            {esDeudaParcial ? "Registrar el resto del pago" : "Cobrar"}
          </h2>
          <CobrarTrabajoForm
            id={trabajo.id}
            saldoPendiente={saldoPendiente}
            cuentaCorrienteHabilitada={Boolean(trabajo.clients?.cuenta_corriente_habilitada)}
          />
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-neutral-400">Creado el {mostrarFechaHora(trabajo.created_at)}</p>
        <a href={`/api/documentos/${trabajo.id}`} className="text-sm text-[#6B4635] underline" download>
          Descargar comprobante (PDF)
        </a>
      </div>

      {trabajosAnteriores && trabajosAnteriores.length > 0 && (
        <div className="pt-4 border-t border-neutral-200">
          <h2 className="text-sm font-medium text-neutral-700 mb-2">
            Historial de trabajos de {trabajo.clients?.nombre}
          </h2>
          <div className="space-y-3">
            {trabajosAnteriores.map((t) => {
              const tItems = (t as any).work_items ?? [];
              const nombresServicios = tItems
                .map((it: any) => it.services?.nombre)
                .filter(Boolean)
                .join(", ");
              const fichas = tItems.filter((it: any) => it.ficha_tecnica);

              return (
                <div key={t.id} className="rounded-md border border-neutral-200 overflow-hidden">
                  <Link
                    href={`/trabajos/${t.id}`}
                    className="flex items-center justify-between px-3 py-2 text-sm hover:bg-neutral-50"
                  >
                    <div>
                      <p className="text-neutral-900">
                        Trabajo #{t.numero}
                        {nombresServicios ? ` - ${nombresServicios}` : ""}
                      </p>
                      <p className="text-xs text-neutral-500">{mostrarFecha(t.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-neutral-900">{formatearPesos(t.total)}</p>
                      <Badge variant={t.estado === "COBRADO" ? "success" : "neutral"}>
                        {ESTADO_TRABAJO[t.estado as keyof typeof ESTADO_TRABAJO]}
                      </Badge>
                    </div>
                  </Link>

                  {fichas.length > 0 && (
                    <div className="border-t border-neutral-100 bg-neutral-50 px-3 py-2 space-y-2">
                      {fichas.map((f: any, i: number) => (
                        <div key={i} className="text-xs">
                          <p className="text-neutral-500 font-medium">{f.services?.nombre} — ficha técnica</p>
                          <p className="text-neutral-700 whitespace-pre-wrap">{f.ficha_tecnica}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}