import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/server";
import { checkAuth } from "@/lib/auth/guards";

function primerYUltimoDia(mesISO: string) {
  const [anio, mes] = mesISO.split("-").map(Number);
  const primerDia = `${mesISO}-01`;
  const ultimoDiaNum = new Date(anio, mes, 0).getDate();
  const ultimoDia = `${mesISO}-${String(ultimoDiaNum).padStart(2, "0")}`;
  return { primerDia, ultimoDia };
}

const MEDIO_PAGO: Record<string, string> = {
  EFECTIVO: "Efectivo",
  TRANSFERENCIA: "Transferencia",
  TARJETA: "Tarjeta",
};

export async function GET(request: Request) {
  const perfil = await checkAuth();
  if (!perfil) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const mes = searchParams.get("mes") ?? new Date().toISOString().slice(0, 7);
  const { primerDia, ultimoDia } = primerYUltimoDia(mes);

  const supabase = await createClient();
  const { data: movimientos, error } = await supabase
    .from("cash_movements")
    .select("*, works(numero)")
    .gte("created_at", `${primerDia}T00:00:00`)
    .lt("created_at", `${ultimoDia}T23:59:59`)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "No se pudo generar el archivo" }, { status: 500 });
  }

  const filas = (movimientos ?? []).map((m) => ({
    Fecha: new Date(m.created_at).toLocaleDateString("es-AR"),
    Tipo: m.tipo === "INGRESO" ? "Ingreso" : "Egreso",
    Forma: MEDIO_PAGO[m.metodo] ?? m.metodo,
    Concepto: m.descripcion ?? "",
    Trabajo: (m as any).works ? `#${(m as any).works.numero}` : "",
    Monto: m.tipo === "INGRESO" ? Number(m.monto) : -Number(m.monto),
  }));

  const hoja = XLSX.utils.json_to_sheet(filas);
  hoja["!cols"] = [{ wch: 12 }, { wch: 10 }, { wch: 14 }, { wch: 35 }, { wch: 10 }, { wch: 12 }];

  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, "Caja");

  const buffer = XLSX.write(libro, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="caja-${mes}.xlsx"`,
    },
  });
}