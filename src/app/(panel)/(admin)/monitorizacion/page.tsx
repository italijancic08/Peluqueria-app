import Link from "next/link";
import { CircleAlert, Mail, MailCheck, MailX } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { ReenviarEmailButton } from "@/components/monitorizacion/reenviar-email-button";
import { StatCard } from "@/components/dashboard/stat-card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { RUTAS } from "@/constants/routes";
import { mostrarFechaHora } from "@/lib/dates";
import { cn } from "@/lib/utils";
import {
  ESTADOS_EMAIL,
  ETIQUETA_TIPO_EMAIL,
  TIPOS_EMAIL,
  type EstadoEmail,
  type TipoEmail,
} from "@/lib/email/tipos";

type SearchParams = { estado?: string; tipo?: string };

function href(estado?: string, tipo?: string) {
  const params = new URLSearchParams();
  if (estado) params.set("estado", estado);
  if (tipo) params.set("tipo", tipo);
  const qs = params.toString();
  return qs ? `${RUTAS.monitorizacion}?${qs}` : RUTAS.monitorizacion;
}

function Pastilla({
  activa,
  to,
  children,
}: {
  activa: boolean;
  to: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={to}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        activa
          ? "border-[#6B4635] bg-[#6B4635] text-white"
          : "border-[#EDD9C4] bg-white text-[#6B4635] hover:bg-[#FBF3EA]"
      )}
    >
      {children}
    </Link>
  );
}

export default async function MonitorizacionPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const estado = (ESTADOS_EMAIL as readonly string[]).includes(sp.estado ?? "")
    ? (sp.estado as EstadoEmail)
    : undefined;
  const tipo = (TIPOS_EMAIL as readonly string[]).includes(sp.tipo ?? "")
    ? (sp.tipo as TipoEmail)
    : undefined;

  const supabase = await createClient();

  let query = supabase
    .from("email_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (estado) query = query.eq("estado", estado);
  if (tipo) query = query.eq("tipo", tipo);

  // Totales de los últimos 30 días (no dependen de los filtros).
  const desde = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const contar = (e?: EstadoEmail) => {
    let q = supabase
      .from("email_logs")
      .select("id", { count: "exact", head: true })
      .gte("created_at", desde);
    if (e) q = q.eq("estado", e);
    return q;
  };

  const [{ data: registros, error }, total, enviados, fallidos] = await Promise.all([
    query,
    contar(),
    contar("ENVIADO"),
    contar("FALLIDO"),
  ]);

  const lista = registros ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Monitorización de mails</h1>
        <p className="text-sm text-neutral-500">
          Estado de los mails automáticos que se envían a los clientes (últimos 30 días en los totales).
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Intentos de envío" value={String(total.count ?? 0)} icon={Mail} />
        <StatCard label="Enviados" value={String(enviados.count ?? 0)} icon={MailCheck} />
        <StatCard
          label="Fallidos"
          value={String(fallidos.count ?? 0)}
          icon={MailX}
          tono={(fallidos.count ?? 0) > 0 ? "alerta" : "neutral"}
        />
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-12 text-xs text-[#9C8577]">Estado</span>
          <Pastilla activa={!estado} to={href(undefined, tipo)}>
            Todos
          </Pastilla>
          <Pastilla activa={estado === "ENVIADO"} to={href("ENVIADO", tipo)}>
            Enviados
          </Pastilla>
          <Pastilla activa={estado === "FALLIDO"} to={href("FALLIDO", tipo)}>
            Fallidos
          </Pastilla>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-12 text-xs text-[#9C8577]">Tipo</span>
          <Pastilla activa={!tipo} to={href(estado, undefined)}>
            Todos
          </Pastilla>
          {TIPOS_EMAIL.map((t) => (
            <Pastilla key={t} activa={tipo === t} to={href(estado, t)}>
              {ETIQUETA_TIPO_EMAIL[t]}
            </Pastilla>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600">No se pudo cargar el historial de mails.</p>
      )}

      {!error && lista.length === 0 && (
        <p className="text-sm text-neutral-500">
          {estado || tipo
            ? "No hay mails con ese filtro."
            : "Todavía no se envió ningún mail automático."}
        </p>
      )}

      {!error && lista.length > 0 && (
        <Table>
          <Thead>
            <Tr>
              <Th>Fecha</Th>
              <Th>Tipo</Th>
              <Th>Cliente</Th>
              <Th>Email</Th>
              <Th>Estado</Th>
              <Th>Motivo</Th>
              <Th>Acción</Th>
            </Tr>
          </Thead>
          <Tbody>
            {lista.map((r) => {
              const tipoLabel = ETIQUETA_TIPO_EMAIL[r.tipo as TipoEmail] ?? r.tipo;
              const fallido = r.estado === "FALLIDO";
              return (
                <Tr key={r.id}>
                  <Td className="whitespace-nowrap">{mostrarFechaHora(r.created_at)}</Td>
                  <Td>
                    <p>{tipoLabel}</p>
                    {r.referencia && (
                      <p className="text-xs text-[#9C8577]">{r.referencia}</p>
                    )}
                  </Td>
                  <Td>
                    {r.client_id ? (
                      <Link href={RUTAS.cliente(r.client_id)} className="underline">
                        {r.cliente_nombre || "Ver cliente"}
                      </Link>
                    ) : (
                      (r.cliente_nombre || "—")
                    )}
                  </Td>
                  <Td className="break-all">{r.email_destino ?? "—"}</Td>
                  <Td>
                    <Badge variant={fallido ? "danger" : "success"}>
                      {fallido ? "Fallido" : "Enviado"}
                    </Badge>
                  </Td>
                  <Td className="min-w-[14rem]">
                    {r.motivo ? (
                      <span
                        className={cn(
                          "flex items-start gap-1.5 text-xs",
                          fallido ? "text-[#B1543A]" : "text-[#A8741F]"
                        )}
                      >
                        <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        {r.motivo}
                      </span>
                    ) : (
                      <span className="text-[#9C8577]">—</span>
                    )}
                  </Td>
                  <Td className="whitespace-nowrap">
                    {fallido && r.reenviado_at ? (
                      <span className="text-xs text-[#5C6640]">
                        Reenviado el {mostrarFechaHora(r.reenviado_at)}
                      </span>
                    ) : fallido && (r.work_id || r.budget_id || r.appointment_id) ? (
                      <ReenviarEmailButton id={r.id} />
                    ) : (
                      <span className="text-[#9C8577]">—</span>
                    )}
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      )}

      {lista.length === 100 && (
        <p className="text-xs text-[#9C8577]">Se muestran los últimos 100 registros.</p>
      )}
    </div>
  );
}