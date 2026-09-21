import { FileText, FileSpreadsheet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/guards";
import { formatearPesos } from "@/lib/format";
import { mostrarFecha } from "@/lib/dates";

type MesReporte = { valor: string; etiqueta: string };

function ultimosMeses(cantidad: number): MesReporte[] {
  const hoy = new Date();
  const resultado: MesReporte[] = [];

  for (let i = 0; i < cantidad; i++) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    const valor = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const etiquetaCruda = d.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
    const etiqueta = etiquetaCruda.charAt(0).toUpperCase() + etiquetaCruda.slice(1);
    resultado.push({ valor, etiqueta });
  }

  return resultado;
}

function FilaTrabajo({ t }: { t: any }) {
  const nombreCliente = t.clients ? `${t.clients.apellido}, ${t.clients.nombre}` : "";
  const enlace = "/api/documentos/" + t.id;

  return (
    <a key={t.id} href={enlace} download className="flex items-center justify-between px-3 py-2 text-sm hover:bg-neutral-50">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F3E5D6]">
          <FileText className="h-4 w-4 text-[#6B4635]" />
        </span>
        <div>
          <p className="text-neutral-900">Trabajo #{t.numero} — {nombreCliente}</p>
          <p className="text-xs text-neutral-500">{mostrarFecha(t.created_at)}</p>
        </div>
      </div>
      <span className="text-neutral-500">{formatearPesos(t.total)}</span>
    </a>
  );
}

function FilaMes({ m }: { m: MesReporte }) {
  const enlace = "/api/export/caja?mes=" + m.valor;

  return (
    <a key={m.valor} href={enlace} className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-neutral-50">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F3E5D6]">
        <FileSpreadsheet className="h-4 w-4 text-[#6B4635]" />
      </span>
      <span className="text-neutral-900">Caja de {m.etiqueta} (Excel)</span>
    </a>
  );
}

export default async function DocumentosPage() {
  const perfil = await requireAuth();
  const supabase = await createClient();

  let query = supabase
    .from("works")
    .select("*, clients(nombre, apellido)")
    .neq("estado", "DISPONIBLE")
    .neq("estado", "CANCELADO")
    .order("created_at", { ascending: false })
    .limit(30);

  if (perfil.rol !== "ADMIN") {
    query = query.eq("profile_id", perfil.id);
  }

  const { data: trabajos } = await query;
  const listaTrabajos = trabajos ?? [];

  const mesesCandidatos = ultimosMeses(12);
  let mesesConDatos: MesReporte[] = [];

  if (perfil.rol === "ADMIN") {
    const { data: movimientos } = await supabase
      .from("cash_movements")
      .select("created_at")
      .gte("created_at", `${mesesCandidatos[mesesCandidatos.length - 1].valor}-01T00:00:00`);

    const mesesConMovimiento = new Set(
      (movimientos ?? []).map((m) => new Date(m.created_at).toISOString().slice(0, 7))
    );

    mesesConDatos = mesesCandidatos.filter((m) => mesesConMovimiento.has(m.valor));
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Documentos</h1>
        <p className="text-sm text-neutral-500">Comprobantes y reportes descargables.</p>
      </div>

      <div>
        <h2 className="text-sm font-medium text-neutral-700 mb-2">Comprobantes de trabajos</h2>

        {listaTrabajos.length === 0 && (
          <p className="text-sm text-neutral-500">Todavía no hay trabajos con comprobante disponible.</p>
        )}

        {listaTrabajos.length > 0 && (
          <div className="rounded-md border border-neutral-200 divide-y divide-neutral-100 bg-white">
            {listaTrabajos.map((t) => <FilaTrabajo key={t.id} t={t} />)}
          </div>
        )}
      </div>

      {perfil.rol === "ADMIN" && (
        <div>
          <h2 className="text-sm font-medium text-neutral-700 mb-2">Reportes de caja</h2>

          {mesesConDatos.length === 0 && (
            <p className="text-sm text-neutral-500">Todavía no hay movimientos de caja para exportar.</p>
          )}

          {mesesConDatos.length > 0 && (
            <div className="rounded-md border border-neutral-200 divide-y divide-neutral-100 bg-white">
              {mesesConDatos.map((m) => <FilaMes key={m.valor} m={m} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}