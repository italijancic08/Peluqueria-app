import { mostrarFecha } from "@/lib/dates";
import { formatearPesos } from "@/lib/format";
import { formatearCodigo } from "@/lib/validations/codigo-turno";
import {
  DIRECCION_NEGOCIO,
  EMAIL_NEGOCIO,
  TELEFONO_NEGOCIO,
} from "@/constants/negocio";

export type Plantilla = { asunto: string; html: string };

export function escapar(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type Fila = { etiqueta: string; valor: string };

type Layout = {
  nombreNegocio: string;
  titulo: string;
  saludo: string;
  intro: string;
  filas?: Fila[];
  bloque?: { titulo: string; texto: string };
  /** Código del turno, destacado en grande (solo lo usa el mail de turno confirmado). */
  codigoDestacado?: string;
  boton?: { texto: string; url: string };
  cierre?: string;
};

function layout(p: Layout): string {
  const filas = (p.filas ?? [])
    .map(
      (f) => `
        <tr>
          <td style="padding:8px 0;font-size:13px;color:#9C8577;width:38%;vertical-align:top;">${escapar(f.etiqueta)}</td>
          <td style="padding:8px 0;font-size:14px;color:#4A3428;font-weight:600;vertical-align:top;">${escapar(f.valor)}</td>
        </tr>`
    )
    .join("");

  const tabla = filas
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border-top:1px solid #EDD9C4;border-bottom:1px solid #EDD9C4;">${filas}</table>`
    : "";

  const bloque = p.bloque
    ? `<div style="margin:16px 0;padding:12px 14px;background:#FBF3EA;border-radius:8px;border:1px solid #EDD9C4;">
         <p style="margin:0 0 4px;font-size:12px;color:#9C8577;">${escapar(p.bloque.titulo)}</p>
         <p style="margin:0;font-size:14px;color:#4A3428;">${escapar(p.bloque.texto)}</p>
       </div>`
    : "";

  const codigo = p.codigoDestacado
    ? `<div style="margin:20px 0;padding:16px;background:#FBF3EA;border-radius:8px;border:1px solid #EDD9C4;text-align:center;">
         <p style="margin:0 0 6px;font-size:12px;color:#9C8577;">Tu código de turno</p>
         <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:30px;font-weight:bold;letter-spacing:6px;color:#4A3428;">${escapar(formatearCodigo(p.codigoDestacado))}</p>
       </div>`
    : "";

  const boton = p.boton
    ? `<p style="margin:24px 0 8px;text-align:center;">
         <a href="${escapar(p.boton.url)}" style="display:inline-block;background:#6B4635;color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;">${escapar(p.boton.texto)}</a>
       </p>`
    : "";

  const cierre = p.cierre
    ? `<p style="margin:16px 0 0;font-size:13px;color:#9C8577;line-height:1.5;">${escapar(p.cierre)}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="es">
<body style="margin:0;padding:0;background:#F6E4D3;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F6E4D3;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border:1px solid #EDD9C4;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="background:#6B4635;padding:20px 24px;text-align:center;">
            <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#FFFFFF;">${escapar(p.nombreNegocio)}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 24px;">
            <h1 style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:20px;color:#4A3428;">${escapar(p.titulo)}</h1>
            <p style="margin:0 0 8px;font-size:14px;color:#4A3428;">${escapar(p.saludo)}</p>
            <p style="margin:0;font-size:14px;color:#4A3428;line-height:1.55;">${escapar(p.intro)}</p>
            ${tabla}
            ${bloque}
            ${codigo}
            ${boton}
            ${cierre}
          </td>
        </tr>
        <tr>
          <td style="background:#F3E5D6;padding:16px 24px;text-align:center;font-size:12px;color:#6B4635;line-height:1.6;">
            ${escapar(DIRECCION_NEGOCIO)}<br />
            ${escapar(TELEFONO_NEGOCIO)} · ${escapar(EMAIL_NEGOCIO)}
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

type Base = { nombreNegocio: string; nombreCliente: string };

function saludo(nombre: string) {
  return nombre ? `Hola ${nombre},` : "Hola,";
}

function numero(n: number) {
  return String(n).padStart(4, "0");
}

function fechaLarga(iso: string) {
  return mostrarFecha(iso, "EEEE dd/MM/yyyy 'a las' HH:mm 'hs'");
}

export function plantillaComprobante(
  d: Base & { numero: number; fecha: string; total: number; servicios: string[] }
): Plantilla {
  return {
    asunto: `Tu comprobante N° ${numero(d.numero)} - ${d.nombreNegocio}`,
    html: layout({
      ...d,
      titulo: "Gracias por tu visita",
      saludo: saludo(d.nombreCliente),
      intro: "Te enviamos el comprobante de tu atención. Lo encontrás adjunto en este mail.",
      filas: [
        { etiqueta: "Comprobante", valor: `N° ${numero(d.numero)}` },
        { etiqueta: "Fecha", valor: mostrarFecha(d.fecha) },
        ...(d.servicios.length
          ? [{ etiqueta: "Servicios", valor: d.servicios.join(", ") }]
          : []),
        { etiqueta: "Total", valor: formatearPesos(d.total) },
      ],
      cierre: "¡Te esperamos pronto!",
    }),
  };
}

export function plantillaPresupuesto(
  d: Base & { numero: number; fecha: string; total: number; servicios: string[]; notas: string | null }
): Plantilla {
  return {
    asunto: `Tu presupuesto N° ${numero(d.numero)} - ${d.nombreNegocio}`,
    html: layout({
      ...d,
      titulo: "Tu presupuesto",
      saludo: saludo(d.nombreCliente),
      intro: "Te enviamos el presupuesto que nos pediste. Lo encontrás adjunto en este mail.",
      filas: [
        { etiqueta: "Presupuesto", valor: `N° ${numero(d.numero)}` },
        { etiqueta: "Fecha", valor: mostrarFecha(d.fecha) },
        ...(d.servicios.length
          ? [{ etiqueta: "Servicios", valor: d.servicios.join(", ") }]
          : []),
        { etiqueta: "Total", valor: formatearPesos(d.total) },
      ],
      bloque: d.notas ? { titulo: "Observaciones", texto: d.notas } : undefined,
      cierre: "Si querés avanzar o tenés dudas, respondé este mail o comunicate con nosotros.",
    }),
  };
}

type DatosTurno = Base & {
  numero: number;
  codigo: string;
  inicio: string;
  servicios: string[];
  urlGestion: string | null;
  urlReserva: string | null;
};

export function plantillaTurnoConfirmado(d: DatosTurno): Plantilla {
  return {
    asunto: `Turno N° ${d.numero} confirmado - ${d.nombreNegocio}`,
    html: layout({
      ...d,
      titulo: "¡Tu turno está reservado!",
      saludo: saludo(d.nombreCliente),
      intro:
        "Te confirmamos que tu turno quedó registrado. Guardá este mail: con el código de abajo podés cancelar o cambiar el horario cuando lo necesites.",
      filas: [
        { etiqueta: "Turno", valor: `N° ${d.numero}` },
        { etiqueta: "Fecha y hora", valor: fechaLarga(d.inicio) },
        ...(d.servicios.length
          ? [{ etiqueta: "Servicios", valor: d.servicios.join(", ") }]
          : []),
      ],
      codigoDestacado: d.codigo,
      boton: d.urlGestion ? { texto: "Gestionar mi turno", url: d.urlGestion } : undefined,
      cierre:
        "También podés ingresar tu código en “Gestionar turno” desde nuestra página. ¡Te esperamos!",
    }),
  };
}

export function plantillaTurnoCancelado(
  d: DatosTurno & { canceladoPor: "CLIENTE" | "STAFF"; motivo: string | null }
): Plantilla {
  const porCliente = d.canceladoPor === "CLIENTE";
  return {
    asunto: `Turno N° ${d.numero} cancelado - ${d.nombreNegocio}`,
    html: layout({
      ...d,
      titulo: "Turno cancelado",
      saludo: saludo(d.nombreCliente),
      intro: porCliente
        ? "Confirmamos que tu turno fue cancelado, como nos pediste."
        : "Lamentablemente tuvimos que cancelar tu turno. Disculpá las molestias.",
      filas: [
        { etiqueta: "Turno", valor: `N° ${d.numero}` },
        { etiqueta: "Era el", valor: fechaLarga(d.inicio) },
        ...(d.servicios.length
          ? [{ etiqueta: "Servicios", valor: d.servicios.join(", ") }]
          : []),
      ],
      bloque: d.motivo ? { titulo: "Motivo", texto: d.motivo } : undefined,
      boton: d.urlReserva ? { texto: "Sacar un nuevo turno", url: d.urlReserva } : undefined,
      cierre: "Cuando quieras podés reservar otro horario desde nuestra página.",
    }),
  };
}

export function plantillaReprogramacionPropuesta(
  d: DatosTurno & { inicioActual: string; inicioPropuesto: string; motivo: string | null }
): Plantilla {
  return {
    asunto: `Te proponemos un nuevo horario para tu turno N° ${d.numero} - ${d.nombreNegocio}`,
    html: layout({
      ...d,
      titulo: "Nuevo horario propuesto",
      saludo: saludo(d.nombreCliente),
      intro:
        "Necesitamos mover tu turno y te proponemos un nuevo horario. Tenés que aceptarlo o rechazarlo desde el enlace de abajo.",
      filas: [
        { etiqueta: "Turno", valor: `N° ${d.numero}` },
        { etiqueta: "Horario actual", valor: fechaLarga(d.inicioActual) },
        { etiqueta: "Horario propuesto", valor: fechaLarga(d.inicioPropuesto) },
        ...(d.servicios.length
          ? [{ etiqueta: "Servicios", valor: d.servicios.join(", ") }]
          : []),
      ],
      bloque: d.motivo ? { titulo: "Motivo", texto: d.motivo } : undefined,
      boton: d.urlGestion ? { texto: "Responder propuesta", url: d.urlGestion } : undefined,
      cierre: "Mientras no respondas, tu turno se mantiene en el horario actual.",
    }),
  };
}

export function plantillaReprogramacionSolicitada(
  d: DatosTurno & { inicioActual: string; inicioPropuesto: string; motivo: string | null }
): Plantilla {
  return {
    asunto: `Recibimos tu pedido de reprogramación - Turno N° ${d.numero}`,
    html: layout({
      ...d,
      titulo: "Pedido recibido",
      saludo: saludo(d.nombreCliente),
      intro:
        "Recibimos tu pedido para cambiar el horario del turno. Te avisamos por mail apenas lo revisemos.",
      filas: [
        { etiqueta: "Turno", valor: `N° ${d.numero}` },
        { etiqueta: "Horario actual", valor: fechaLarga(d.inicioActual) },
        { etiqueta: "Horario pedido", valor: fechaLarga(d.inicioPropuesto) },
      ],
      bloque: d.motivo ? { titulo: "Tu motivo", texto: d.motivo } : undefined,
      boton: d.urlGestion ? { texto: "Ver mi turno", url: d.urlGestion } : undefined,
      cierre: "Mientras tanto, tu turno se mantiene en el horario actual.",
    }),
  };
}

export function plantillaReprogramacionConfirmada(
  d: DatosTurno & { inicioAnterior: string; aceptadoPedidoDelCliente: boolean }
): Plantilla {
  return {
    asunto: `Tu turno N° ${d.numero} fue reprogramado - ${d.nombreNegocio}`,
    html: layout({
      ...d,
      titulo: "Turno reprogramado",
      saludo: saludo(d.nombreCliente),
      intro: d.aceptadoPedidoDelCliente
        ? "Aceptamos tu pedido de cambio de horario. Tu turno quedó confirmado en el nuevo horario."
        : "Tu turno quedó confirmado en el nuevo horario.",
      filas: [
        { etiqueta: "Turno", valor: `N° ${d.numero}` },
        { etiqueta: "Antes", valor: fechaLarga(d.inicioAnterior) },
        { etiqueta: "Ahora", valor: fechaLarga(d.inicio) },
        ...(d.servicios.length
          ? [{ etiqueta: "Servicios", valor: d.servicios.join(", ") }]
          : []),
      ],
      boton: d.urlGestion ? { texto: "Ver mi turno", url: d.urlGestion } : undefined,
      cierre: "¡Te esperamos!",
    }),
  };
}

export function plantillaReprogramacionRechazada(
  d: DatosTurno & { inicioPedido: string; motivo: string | null }
): Plantilla {
  return {
    asunto: `No pudimos reprogramar tu turno N° ${d.numero} - ${d.nombreNegocio}`,
    html: layout({
      ...d,
      titulo: "Reprogramación no aceptada",
      saludo: saludo(d.nombreCliente),
      intro:
        "No pudimos aceptar el horario que pediste. Tu turno se mantiene como estaba. Podés pedir otro horario desde el enlace de abajo.",
      filas: [
        { etiqueta: "Turno", valor: `N° ${d.numero}` },
        { etiqueta: "Horario pedido", valor: fechaLarga(d.inicioPedido) },
        { etiqueta: "Tu turno sigue el", valor: fechaLarga(d.inicio) },
      ],
      bloque: d.motivo ? { titulo: "Motivo", texto: d.motivo } : undefined,
      boton: d.urlGestion ? { texto: "Gestionar mi turno", url: d.urlGestion } : undefined,
    }),
  };
}