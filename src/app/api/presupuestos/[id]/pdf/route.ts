import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "fs";
import path from "path";

import { createClient } from "@/lib/supabase/server";
import { checkAuth } from "@/lib/auth/guards";

export const runtime = "nodejs";

const DIRECCION_NEGOCIO = "Bolivar 499, Reconquista, Santa Fe";
const EMAIL_NEGOCIO = "nadiatalijancic27@gmail.com";
const TELEFONO_NEGOCIO = "3482 64 8654";

function formatearPesos(valor: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(valor);
}

function numeroDocumento(numero: number) {
  return String(numero).padStart(4, "0");
}

function formatearDuracion(minutos?: number | null) {
  if (!minutos) return "";

  if (minutos < 60) {
    return `${minutos} min`;
  }

  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;

  if (resto === 0) {
    return `${horas} h`;
  }

  return `${horas} h ${resto} min`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const perfil = await checkAuth();

  if (!perfil) {
    return NextResponse.json(
      { error: "No autorizado." },
      { status: 401 }
    );
  }

  const { id } = await params;
  const supabase = await createClient();

  const { data: presupuesto, error: presupuestoError } =
    await supabase
      .from("budgets")
      .select(`
        id,
        numero,
        total,
        notas,
        created_at,
        clients (
          nombre,
          apellido,
          telefono,
          email,
          direccion
        )
      `)
      .eq("id", id)
      .single();

  if (presupuestoError || !presupuesto) {
    return NextResponse.json(
      { error: "Presupuesto no encontrado." },
      { status: 404 }
    );
  }

  const { data: items, error: itemsError } = await supabase
    .from("budget_items")
    .select(`
      service_id,
      precio_snapshot,
      services (
        nombre,
        duracion_min
      )
    `)
    .eq("budget_id", id);

  if (itemsError) {
    return NextResponse.json(
      { error: "No se pudieron obtener los servicios." },
      { status: 500 }
    );
  }

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);

  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const negro = rgb(0.15, 0.13, 0.12);
  const gris = rgb(0.35, 0.35, 0.35);
  const borde = rgb(0.62, 0.62, 0.62);
  const marron = rgb(0.60, 0.36, 0.27);
  const beige = rgb(0.96, 0.80, 0.68);
  const beigePie = rgb(0.88, 0.65, 0.45);

  // FRANJA SUPERIOR
  page.drawRectangle({
    x: 0,
    y: 790,
    width: 595.28,
    height: 52,
    color: beige,
  });

  const titulo = "PRESUPUESTO";
  const tituloWidth = bold.widthOfTextAtSize(titulo, 25);

  page.drawText(titulo, {
    x: (595.28 - tituloWidth) / 2,
    y: 806,
    size: 25,
    font: bold,
    color: negro,
  });

  // LOGO
  const logoPath = path.join(process.cwd(), "public", "logo.png");

  if (fs.existsSync(logoPath)) {
    const logoBytes = fs.readFileSync(logoPath);
    const logo = await pdfDoc.embedPng(logoBytes);

    const anchoLogo = 275;
    const altoLogo = anchoLogo * (212 / 500);

    page.drawImage(logo, {
      x: 55,
      y: 640,
      width: anchoLogo,
      height: altoLogo,
    });
  }

  // NÚMERO
  page.drawText("Presupuesto", {
    x: 462,
    y: 738,
    size: 10,
    font: regular,
    color: negro,
  });

  page.drawText(`N° ${numeroDocumento(presupuesto.numero)}`, {
    x: 455,
    y: 720,
    size: 12,
    font: bold,
    color: marron,
  });

  // FECHA
  const fecha = new Date(
    presupuesto.created_at
  ).toLocaleDateString("es-AR");

  page.drawRectangle({
    x: 365,
    y: 675,
    width: 150,
    height: 27,
    borderColor: gris,
    borderWidth: 1,
  });

  page.drawLine({
    start: { x: 425, y: 675 },
    end: { x: 425, y: 702 },
    thickness: 1,
    color: gris,
  });

  page.drawText("FECHA", {
    x: 378,
    y: 684,
    size: 9,
    font: regular,
    color: gris,
  });

  page.drawText(fecha, {
    x: 435,
    y: 684,
    size: 9,
    font: regular,
    color: negro,
  });

  // CLIENTE
  const cliente = presupuesto.clients;

  const nombreCliente =
    `${cliente?.nombre ?? ""} ${cliente?.apellido ?? ""}`.trim();

  const datosY = 590;

  page.drawText("Cliente:", {
    x: 55,
    y: datosY,
    size: 9,
    font: regular,
    color: gris,
  });

  page.drawText(nombreCliente, {
    x: 100,
    y: datosY,
    size: 9,
    font: regular,
    color: negro,
  });

  page.drawLine({
    start: { x: 100, y: datosY - 3 },
    end: { x: 290, y: datosY - 3 },
    thickness: 0.6,
    color: borde,
  });

  page.drawText("Teléfono:", {
    x: 325,
    y: datosY,
    size: 9,
    font: regular,
    color: gris,
  });

  page.drawText(cliente?.telefono ?? "", {
    x: 380,
    y: datosY,
    size: 9,
    font: regular,
    color: negro,
  });

  page.drawLine({
    start: { x: 380, y: datosY - 3 },
    end: { x: 515, y: datosY - 3 },
    thickness: 0.6,
    color: borde,
  });

page.drawText("Dirección:", {
  x: 55,
  y: datosY - 27,
  size: 9,
  font: regular,
  color: gris,
});

page.drawText(cliente?.direccion?.trim() || "", {
  x: 105,
  y: datosY - 27,
  size: 8,
  font: regular,
  color: negro,
  maxWidth: 185,
});

page.drawLine({
  start: { x: 105, y: datosY - 30 },
  end: { x: 290, y: datosY - 30 },
  thickness: 0.6,
  color: borde,
});

  page.drawText("Correo:", {
    x: 325,
    y: datosY - 27,
    size: 9,
    font: regular,
    color: gris,
  });

  page.drawText(cliente?.email ?? "", {
    x: 370,
    y: datosY - 27,
    size: 8,
    font: regular,
    color: negro,
  });

  page.drawLine({
    start: { x: 370, y: datosY - 30 },
    end: { x: 515, y: datosY - 30 },
    thickness: 0.6,
    color: borde,
  });

  // TABLA
  const tableX = 55;
  const tableTop = 535;
  const tableWidth = 460;

  const serviceWidth = 285;
  const priceWidth = 82;
  const timeWidth = tableWidth - serviceWidth - priceWidth;

  const headerHeight = 42;
  const rowHeight = 28;

  const cantidadFilas = Math.max(9, items?.length ?? 0);

  const tableHeight =
    headerHeight + cantidadFilas * rowHeight;

  page.drawRectangle({
    x: tableX,
    y: tableTop - tableHeight,
    width: tableWidth,
    height: tableHeight,
    borderColor: borde,
    borderWidth: 0.7,
  });

  page.drawLine({
    start: {
      x: tableX + serviceWidth,
      y: tableTop,
    },
    end: {
      x: tableX + serviceWidth,
      y: tableTop - tableHeight,
    },
    thickness: 0.7,
    color: borde,
  });

  page.drawLine({
    start: {
      x: tableX + serviceWidth + priceWidth,
      y: tableTop,
    },
    end: {
      x: tableX + serviceWidth + priceWidth,
      y: tableTop - tableHeight,
    },
    thickness: 0.7,
    color: borde,
  });

  page.drawLine({
    start: {
      x: tableX,
      y: tableTop - headerHeight,
    },
    end: {
      x: tableX + tableWidth,
      y: tableTop - headerHeight,
    },
    thickness: 0.7,
    color: borde,
  });

  page.drawText("Servicio", {
    x: tableX + 125,
    y: tableTop - 25,
    size: 10,
    font: bold,
    color: gris,
  });

  page.drawText("Precio", {
    x: tableX + serviceWidth + 25,
    y: tableTop - 25,
    size: 10,
    font: bold,
    color: gris,
  });

  page.drawText("Tiempo", {
    x: tableX + serviceWidth + priceWidth + 23,
    y: tableTop - 18,
    size: 9,
    font: bold,
    color: gris,
  });

  page.drawText("(estimado)", {
    x: tableX + serviceWidth + priceWidth + 16,
    y: tableTop - 30,
    size: 8,
    font: bold,
    color: gris,
  });

  for (let i = 1; i <= cantidadFilas; i++) {
    const y =
      tableTop - headerHeight - i * rowHeight;

    page.drawLine({
      start: { x: tableX, y },
      end: { x: tableX + tableWidth, y },
      thickness: 0.5,
      color: borde,
    });
  }

  (items ?? []).forEach((item, index) => {
    const y =
      tableTop -
      headerHeight -
      index * rowHeight -
      18;

    page.drawText(item.services?.nombre ?? "Servicio", {
      x: tableX + 8,
      y,
      size: 9,
      font: regular,
      color: negro,
      maxWidth: serviceWidth - 16,
    });

    page.drawText(
      formatearPesos(Number(item.precio_snapshot)),
      {
        x: tableX + serviceWidth + 8,
        y,
        size: 8,
        font: regular,
        color: negro,
        maxWidth: priceWidth - 12,
      }
    );

    page.drawText(
      formatearDuracion(item.services?.duracion_min),
      {
        x:
          tableX +
          serviceWidth +
          priceWidth +
          8,
        y,
        size: 8,
        font: regular,
        color: negro,
        maxWidth: timeWidth - 12,
      }
    );
  });

  // TOTAL
  const totalWidth = 150;
  const totalHeight = 32;

  const totalX =
    tableX + tableWidth - totalWidth;

  const totalY =
    tableTop - tableHeight - totalHeight - 4;

  page.drawRectangle({
    x: totalX,
    y: totalY,
    width: totalWidth,
    height: totalHeight,
    color: beige,
  });

  page.drawText("Total", {
    x: totalX + 14,
    y: totalY + 11,
    size: 10,
    font: bold,
    color: negro,
  });

  const totalTexto = formatearPesos(
    Number(presupuesto.total)
  );

  const totalTextoWidth =
    bold.widthOfTextAtSize(totalTexto, 9);

  page.drawText(totalTexto, {
    x:
      totalX +
      totalWidth -
      totalTextoWidth -
      12,
    y: totalY + 11,
    size: 9,
    font: bold,
    color: negro,
  });

  // NOTAS
  if (presupuesto.notas) {
    page.drawText(`Observaciones: ${presupuesto.notas}`, {
      x: 55,
      y: totalY - 25,
      size: 8,
      font: regular,
      color: gris,
      maxWidth: 460,
    });
  }

  // PIE
  page.drawRectangle({
    x: 0,
    y: 0,
    width: 595.28,
    height: 70,
    color: beigePie,
  });

  page.drawText(DIRECCION_NEGOCIO, {
    x: 55,
    y: 31,
    size: 8,
    font: regular,
    color: negro,
  });

  page.drawText(EMAIL_NEGOCIO, {
    x: 245,
    y: 31,
    size: 8,
    font: regular,
    color: negro,
  });

  page.drawText(TELEFONO_NEGOCIO, {
    x: 455,
    y: 31,
    size: 8,
    font: regular,
    color: negro,
  });

  const pdfBytes = await pdfDoc.save();

  return new NextResponse(new Uint8Array(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition":
        `attachment; filename="Presupuesto-${numeroDocumento(
          presupuesto.numero
        )}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}