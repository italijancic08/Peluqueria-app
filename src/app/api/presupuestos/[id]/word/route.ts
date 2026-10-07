import { NextResponse } from "next/server";
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Paragraph,
  Packer,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

import { createClient } from "@/lib/supabase/server";
import { checkAuth } from "@/lib/auth/guards";

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

  const { data: presupuesto, error: presupuestoError } = await supabase
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
        email
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
        nombre
      )
    `)
    .eq("budget_id", id);

  if (itemsError) {
    return NextResponse.json(
      { error: "No se pudieron obtener los servicios del presupuesto." },
      { status: 500 }
    );
  }

  const { data: settings } = await supabase
    .from("business_settings")
    .select("nombre_negocio")
    .eq("id", 1)
    .single();

  const nombreNegocio = settings?.nombre_negocio ?? "Peluquería";

  const cliente = presupuesto.clients;

  const formatearPesos = (valor: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    }).format(valor);

  const fecha = new Date(presupuesto.created_at).toLocaleDateString(
    "es-AR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  );

  const filasServicios = (items ?? []).map(
    (item) =>
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: item.services?.nombre ?? "Servicio",
                  }),
                ],
              }),
            ],
          }),

          new TableCell({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: formatearPesos(Number(item.precio_snapshot)),
                  }),
                ],
              }),
            ],
          }),
        ],
      })
  );

  const documento = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 900,
              bottom: 900,
              left: 900,
              right: 900,
            },
          },
        },

        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: nombreNegocio,
                    size: 18,
                    color: "9C8577",
                  }),
                ],
              }),
            ],
          }),
        },

        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: {
              after: 150,
            },
            children: [
              new TextRun({
                text: nombreNegocio,
                bold: true,
                size: 32,
                color: "4A3428",
              }),
            ],
          }),

          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: {
              after: 450,
            },
            children: [
              new TextRun({
                text: "PRESUPUESTO",
                bold: true,
                size: 26,
                color: "6B4635",
              }),
            ],
          }),

          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },

            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: `Presupuesto Nº ${presupuesto.numero}`,
                            bold: true,
                          }),
                        ],
                      }),
                    ],
                  }),

                  new TableCell({
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        children: [
                          new TextRun({
                            text: `Fecha: ${fecha}`,
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({
            spacing: {
              before: 350,
              after: 100,
            },
            children: [
              new TextRun({
                text: "Cliente",
                bold: true,
                size: 22,
                color: "4A3428",
              }),
            ],
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `${cliente?.nombre ?? ""} ${cliente?.apellido ?? ""}`,
                bold: true,
              }),
            ],
          }),

          ...(cliente?.telefono
            ? [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Teléfono: ${cliente.telefono}`,
                    }),
                  ],
                }),
              ]
            : []),

          ...(cliente?.email
            ? [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Email: ${cliente.email}`,
                    }),
                  ],
                }),
              ]
            : []),

          new Paragraph({
            spacing: {
              before: 350,
              after: 120,
            },
            children: [
              new TextRun({
                text: "Servicios",
                bold: true,
                size: 22,
                color: "4A3428",
              }),
            ],
          }),

          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },

            borders: {
              top: {
                style: BorderStyle.SINGLE,
                size: 1,
                color: "D9C4A8",
              },
              bottom: {
                style: BorderStyle.SINGLE,
                size: 1,
                color: "D9C4A8",
              },
              left: {
                style: BorderStyle.SINGLE,
                size: 1,
                color: "D9C4A8",
              },
              right: {
                style: BorderStyle.SINGLE,
                size: 1,
                color: "D9C4A8",
              },
              insideHorizontal: {
                style: BorderStyle.SINGLE,
                size: 1,
                color: "E8D9CC",
              },
              insideVertical: {
                style: BorderStyle.SINGLE,
                size: 1,
                color: "E8D9CC",
              },
            },

            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "Servicio",
                            bold: true,
                          }),
                        ],
                      }),
                    ],
                  }),

                  new TableCell({
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        children: [
                          new TextRun({
                            text: "Precio",
                            bold: true,
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),

              ...filasServicios,
            ],
          }),

          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: {
              before: 250,
            },
            children: [
              new TextRun({
                text: `TOTAL: ${formatearPesos(Number(presupuesto.total))}`,
                bold: true,
                size: 26,
                color: "6B4635",
              }),
            ],
          }),

          ...(presupuesto.notas
            ? [
                new Paragraph({
                  spacing: {
                    before: 350,
                    after: 100,
                  },
                  children: [
                    new TextRun({
                      text: "Notas",
                      bold: true,
                      size: 22,
                      color: "4A3428",
                    }),
                  ],
                }),

                new Paragraph({
                  children: [
                    new TextRun({
                      text: presupuesto.notas,
                    }),
                  ],
                }),
              ]
            : []),

          new Paragraph({
            spacing: {
              before: 650,
            },
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "Gracias por elegirnos.",
                italic: true,
                color: "9C8577",
              }),
            ],
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(documento);

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="Presupuesto-${presupuesto.numero}.docx"`,
    },
  });
}