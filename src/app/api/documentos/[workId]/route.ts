import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createClient } from "@/lib/supabase/server";
import { checkAuth } from "@/lib/auth/guards";
import { formatearPesos, formatearTelefono } from "@/lib/format";
import { mostrarFechaHora } from "@/lib/dates";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ workId: string }> }
) {
  const { workId } = await params;

  const perfil = await checkAuth();
  if (!perfil) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = await createClient();

  const { data: trabajo } = await supabase
    .from("works")
    .select("*, clients(nombre, apellido, telefono)")
    .eq("id", workId)
    .single();

  if (!trabajo) {
    return NextResponse.json({ error: "Trabajo no encontrado" }, { status: 404 });
  }

  const [{ data: items }, { data: pagos }, { data: settings }] = await Promise.all([
    supabase.from("work_items").select("*, services(nombre)").eq("work_id", workId),
    supabase.from("payments").select("*").eq("work_id", workId),
    supabase.from("business_settings").select("nombre_negocio").eq("id", 1).single(),
  ]);

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 en puntos
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const marronOscuro = rgb(0x4a / 255, 0x34 / 255, 0x28 / 255);
  const marronClaro = rgb(0x9c / 255, 0x85 / 255, 0x77 / 255);

  let y = 792;
  const margenIzq = 50;

  function linea(
    texto: string,
    opciones: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb>; x?: number } = {}
  ) {
    page.drawText(texto, {
      x: opciones.x ?? margenIzq,
      y,
      size: opciones.size ?? 11,
      font: opciones.bold ? fontBold : fontRegular,
      color: opciones.color ?? marronOscuro,
    });
  }

  linea(settings?.nombre_negocio ?? "Peluquería", { size: 18, bold: true });
  y -= 22;
  linea(`Comprobante — Trabajo #${trabajo.numero}`, { size: 12, color: marronClaro });
  y -= 16;
  linea(`Fecha: ${mostrarFechaHora(trabajo.created_at)}`, { size: 10, color: marronClaro });
  y -= 30;

  linea("Cliente", { size: 11, bold: true });
  y -= 16;
  linea(`${trabajo.clients?.apellido}, ${trabajo.clients?.nombre}`, { size: 10 });
  y -= 14;
  if (trabajo.clients?.telefono) {
    linea(formatearTelefono(trabajo.clients.telefono), { size: 10, color: marronClaro });
    y -= 14;
  }
  y -= 16;

  linea("Servicios", { size: 11, bold: true });
  y -= 18;

  for (const item of items ?? []) {
    linea((item as any).services?.nombre ?? "Servicio", { size: 10 });
    linea(formatearPesos(item.precio_snapshot), { size: 10, x: 450 });
    y -= 16;
  }

  y -= 6;
  page.drawLine({
    start: { x: margenIzq, y },
    end: { x: 545, y },
    thickness: 1,
    color: marronClaro,
  });
  y -= 18;

  linea("Total", { size: 12, bold: true });
  linea(formatearPesos(trabajo.total), { size: 12, bold: true, x: 450 });
  y -= 28;

  if (pagos && pagos.length > 0) {
    linea("Pagos", { size: 11, bold: true });
    y -= 18;
    for (const p of pagos) {
      linea(p.metodo, { size: 10 });
      linea(formatearPesos(p.monto), { size: 10, x: 450 });
      y -= 16;
    }
  }

  y = 60;
  linea("Gracias por tu visita.", { size: 9, color: marronClaro });

  const bytes = await pdfDoc.save();

  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="comprobante-trabajo-${trabajo.numero}.pdf"`,
    },
  });
}