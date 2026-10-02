import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/guards";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToggleCuentaCorriente } from "@/components/clientes/toggle-cuenta-corriente";
import { formatearTelefono, formatearPesos } from "@/lib/format";
import { mostrarFecha } from "@/lib/dates";
import { RUTAS } from "@/constants/routes";
import { ESTADO_TRABAJO } from "@/constants/labels";
import { eliminarCliente } from "@/actions/clients";

export default async function ClienteDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const perfil = await requireAuth();
  const supabase = await createClient();

  const { data: cliente } = await supabase.from("clients").select("*").eq("id", id).single();

  if (!cliente) notFound();

  const { data: trabajos } = await supabase
    .from("works")
    .select("*, work_items(precio_snapshot, ficha_tecnica, services(nombre))")
    .eq("client_id", id)
    .neq("estado", "DISPONIBLE")
    .neq("estado", "CANCELADO")
    .order("created_at", { ascending: false })
    .limit(30);

  let saldoCC = 0;
  if (cliente.cuenta_corriente_habilitada) {
    const { data: movimientosCC } = await supabase
      .from("account_movements")
      .select("tipo, monto")
      .eq("client_id", id);

    saldoCC = (movimientosCC ?? []).reduce(
      (acc, m) => acc + (m.tipo === "DEBITO" ? Number(m.monto) : -Number(m.monto)),
      0
    );
  }

  async function borrar() {
    "use server";
    const resultado = await eliminarCliente(id);
    if (resultado.ok) redirect(RUTAS.clientes);
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900">
          {cliente.apellido}, {cliente.nombre}
        </h1>
        <div className="flex gap-2">
          <Link href={`${RUTAS.cliente(cliente.id)}/editar`}>
            <Button variant="secondary">Editar</Button>
          </Link>
          {perfil.rol === "ADMIN" && (
            <form action={borrar}>
              <Button type="submit" variant="danger">
                Eliminar
              </Button>
            </form>
          )}
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-neutral-500">Teléfono</dt>
          <dd className="text-neutral-900">{formatearTelefono(cliente.telefono)}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">DNI</dt>
          <dd className="text-neutral-900">{cliente.dni ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">Email</dt>
          <dd className="text-neutral-900">{cliente.email ?? "—"}</dd>
        </div>
      </dl>

      {cliente.notas && (
        <div>
          <h2 className="text-sm font-medium text-neutral-700 mb-1">Notas</h2>
          <p className="text-sm text-neutral-600 whitespace-pre-wrap">{cliente.notas}</p>
        </div>
      )}

      {cliente.cuenta_corriente_habilitada && (
        <div className="pt-4 border-t border-neutral-200 space-y-1">
          <h2 className="text-sm font-medium text-neutral-700">Cuenta corriente</h2>
          <p className={`text-sm ${saldoCC > 0 ? "text-red-600 font-medium" : "text-neutral-500"}`}>
            Saldo: {formatearPesos(saldoCC)}
          </p>
          <Link href={`/cuenta-corriente/${cliente.id}`} className="text-sm text-[#6B4635] underline">
            Ver cuenta corriente completa
          </Link>
        </div>
      )}

      {perfil.rol === "ADMIN" && (
        <div className="pt-2">
          <ToggleCuentaCorriente clientId={cliente.id} habilitada={cliente.cuenta_corriente_habilitada} />
        </div>
      )}

      <div className="pt-4 border-t border-neutral-200">
        <h2 className="text-sm font-medium text-neutral-700 mb-2">Historial de trabajos</h2>

        {(!trabajos || trabajos.length === 0) && (
          <p className="text-sm text-neutral-500">Todavía no tiene trabajos registrados.</p>
        )}

        {trabajos && trabajos.length > 0 && (
          <div className="space-y-3">
            {trabajos.map((t) => {
              const items = (t as any).work_items ?? [];
              const nombresServicios = items
                .map((it: any) => it.services?.nombre)
                .filter(Boolean)
                .join(", ");
              const fichas = items.filter((it: any) => it.ficha_tecnica);

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
        )}
      </div>
    </div>
  );
}