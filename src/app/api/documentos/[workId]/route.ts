import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "fs";
import path from "path";

import { createClient } from "@/lib/supabase/server";
import { checkAuth } from "@/lib/auth/guards";
import { formatearPesos } from "@/lib/format";
import { mostrarFecha } from "@/lib/dates";

export const runtime = "nodejs";

const DIRECCION_NEGOCIO = "Bolivar 499, Reconquista, Santa Fe";
const EMAIL_NEGOCIO = "nadiatalijancic27@gmail.com";
const TELEFONO_NEGOCIO = "(3482) 64 8654";

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

function dibujarIconoUbicacion(
  page: any,
  x: number,
  y: number,
  color: any
) {
  // Cabeza del pin
  page.drawCircle({
    x: x + 5,
    y: y + 7,
    size: 4.5,
    borderColor: color,
    borderWidth: 1.2,
  });

  // Punta del pin
  page.drawLine({
    start: {
      x: x + 1.5,
      y: y + 4,
    },
    end: {
      x: x + 5,
      y: y - 1,
    },
    thickness: 1.2,
    color,
  });

  page.drawLine({
    start: {
      x: x + 8.5,
      y: y + 4,
    },
    end: {
      x: x + 5,
      y: y - 1,
    },
    thickness: 1.2,
    color,
  });

  // Centro del pin
  page.drawCircle({
    x: x + 5,
    y: y + 7,
    size: 1.4,
    color,
  });
}

function dibujarIconoEmail(
  page: any,
  x: number,
  y: number,
  color: any
) {
  // Contorno del sobre
  page.drawRectangle({
    x,
    y,
    width: 12,
    height: 9,
    borderColor: color,
    borderWidth: 1.1,
  });

  // Diagonales internas
  page.drawLine({
    start: {
      x,
      y: y + 9,
    },
    end: {
      x: x + 6,
      y: y + 4.2,
    },
    thickness: 1,
    color,
  });

  page.drawLine({
    start: {
      x: x + 12,
      y: y + 9,
    },
    end: {
      x: x + 6,
      y: y + 4.2,
    },
    thickness: 1,
    color,
  });
}

function dibujarIconoTelefono(
  page: any,
  x: number,
  y: number,
  color: any
) {
  page.drawSvgPath(
    "M6.62 10.79c1.44 1.44 2.89 2.7 4.37 3.79.2.15.45.21.69.16l2.78-.69c.29-.07.53-.3.6-.6l.7-2.78a.99.99 0 0 0-.25-.91l-1.27-1.27a.99.99 0 0 0-1.41 0l-1.11 1.11a15.3 15.3 0 0 1-3.58-3.58l1.11-1.11a.99.99 0 0 0 0-1.41L8.98 2.24a.99.99 0 0 0-.91-.25l-2.78.7c-.29.07-.53.3-.6.6L4 6.07c-.06.24.01.49.16.69 1.09 1.48 2.35 2.93 3.79 4.37z",
    {
      x,
      y,
      scale: 0.85,
      color,
    }
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ workId: string }> }
) {
  const { workId } = await params;

  const perfil = await checkAuth();

  if (!perfil) {
    return NextResponse.json(
      { error: "No autorizado." },
      { status: 401 }
    );
  }

  const supabase = await createClient();

  const { data: trabajo, error: trabajoError } =
    await supabase
      .from("works")
      .select(`
        id,
        numero,
        total,
        created_at,
        clients (
          nombre,
          apellido,
          telefono,
          email,
          direccion
        )
      `)
      .eq("id", workId)
      .single();

  if (trabajoError || !trabajo) {
    return NextResponse.json(
      { error: "Trabajo no encontrado." },
      { status: 404 }
    );
  }

  const { data: items, error: itemsError } =
    await supabase
      .from("work_items")
      .select(`
        service_id,
        precio_snapshot,
        services (
          nombre,
          duracion_min
        )
      `)
      .eq("work_id", workId);

  if (itemsError) {
    return NextResponse.json(
      { error: "No se pudieron obtener los servicios." },
      { status: 500 }
    );
  }

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);

  const regular = await pdfDoc.embedFont(
    StandardFonts.Helvetica
  );

  const bold = await pdfDoc.embedFont(
    StandardFonts.HelveticaBold
  );

  const negro = rgb(0.15, 0.13, 0.12);
  const gris = rgb(0.35, 0.35, 0.35);
  const borde = rgb(0.62, 0.62, 0.62);
  const marron = rgb(0.60, 0.36, 0.27);
  const beige = rgb(0.96, 0.80, 0.68);
  const beigePie = rgb(0.88, 0.65, 0.45);

  // LOGO
  const logoPath = path.join(
    process.cwd(),
    "public",
    "logo.png"
  );

  if (fs.existsSync(logoPath)) {
    const logoBytes = fs.readFileSync(logoPath);
    const logo = await pdfDoc.embedPng(logoBytes);

    const anchoLogo = 275;
    const altoLogo = anchoLogo * (212 / 500);

    page.drawImage(logo, {
      x: 55,
      y: 660,
      width: anchoLogo,
      height: altoLogo,
    });
  }

  // FACTURA
  page.drawText("Factura", {
    x: 465,
    y: 755,
    size: 10,
    font: regular,
    color: negro,
  });

  page.drawText(
    `N° ${numeroDocumento(trabajo.numero)}`,
    {
      x: 455,
      y: 736,
      size: 12,
      font: bold,
      color: marron,
    }
  );

  // FECHA
  const fecha = mostrarFecha(trabajo.created_at);

  page.drawRectangle({
    x: 365,
    y: 690,
    width: 150,
    height: 27,
    borderColor: gris,
    borderWidth: 1,
  });

  page.drawLine({
    start: { x: 425, y: 690 },
    end: { x: 425, y: 717 },
    thickness: 1,
    color: gris,
  });

  page.drawText("FECHA", {
    x: 378,
    y: 699,
    size: 9,
    font: regular,
    color: gris,
  });

  page.drawText(fecha, {
    x: 435,
    y: 699,
    size: 9,
    font: regular,
    color: negro,
  });

  // DATOS CLIENTE
  const cliente = trabajo.clients;

  const nombreCliente =
    `${cliente?.nombre ?? ""} ${cliente?.apellido ?? ""}`.trim();

  const datosY = 610;

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
  const tableTop = 550;
  const tableWidth = 460;

  const serviceWidth = 285;
  const priceWidth = 82;
  const timeWidth =
    tableWidth - serviceWidth - priceWidth;

  const headerHeight = 42;
  const rowHeight = 29;

  const cantidadFilas = Math.max(
    10,
    items?.length ?? 0
  );

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
    x:
      tableX +
      serviceWidth +
      priceWidth +
      23,
    y: tableTop - 18,
    size: 9,
    font: bold,
    color: gris,
  });

  page.drawText("(estimado)", {
    x:
      tableX +
      serviceWidth +
      priceWidth +
      16,
    y: tableTop - 30,
    size: 8,
    font: bold,
    color: gris,
  });

  for (let i = 1; i <= cantidadFilas; i++) {
    const y =
      tableTop -
      headerHeight -
      i * rowHeight;

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
      19;

    page.drawText(
      item.services?.nombre ?? "Servicio",
      {
        x: tableX + 8,
        y,
        size: 9,
        font: regular,
        color: negro,
        maxWidth: serviceWidth - 16,
      }
    );

    page.drawText(
      formatearPesos(
        Number(item.precio_snapshot)
      ),
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
      formatearDuracion(
        item.services?.duracion_min
      ),
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
    tableTop -
    tableHeight -
    totalHeight -
    4;

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
    Number(trabajo.total)
  );

  const totalWidthText =
    bold.widthOfTextAtSize(totalTexto, 9);

  page.drawText(totalTexto, {
    x:
      totalX +
      totalWidth -
      totalWidthText -
      12,
    y: totalY + 11,
    size: 9,
    font: bold,
    color: negro,
  });

  // PIE
page.drawRectangle({
  x: 0,
  y: 0,
  width: 595.28,
  height: 70,
  color: beigePie,
});

// ICONOS
dibujarIconoUbicacion(
  page,
  40,
  27,
  negro
);

dibujarIconoEmail(
  page,
  230,
  29,
  negro
);

dibujarIconoTelefono(
  page,
  438,
  40,
  negro
);

// DATOS DEL NEGOCIO
page.drawText(DIRECCION_NEGOCIO, {
  x: 58,
  y: 31,
  size: 8,
  font: regular,
  color: negro,
});

page.drawText(EMAIL_NEGOCIO, {
  x: 248,
  y: 31,
  size: 8,
  font: regular,
  color: negro,
});

page.drawText(TELEFONO_NEGOCIO, {
  x: 458,
  y: 31,
  size: 8,
  font: regular,
  color: negro,
});

  const pdfBytes = await pdfDoc.save();

  return new NextResponse(
    new Uint8Array(pdfBytes),
    {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          `attachment; filename="Factura-${numeroDocumento(
            trabajo.numero
          )}.pdf"`,
        "Cache-Control": "no-store",
      },
    }
  );
}