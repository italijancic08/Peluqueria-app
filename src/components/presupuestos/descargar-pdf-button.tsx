"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DescargarPdfButton({
  presupuestoId,
  numero,
}: {
  presupuestoId: string;
  numero: number;
}) {
  const [descargando, setDescargando] =
    useState(false);

  async function descargar() {
    try {
      setDescargando(true);

      const respuesta = await fetch(
        `/api/presupuestos/${presupuestoId}/pdf`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      if (!respuesta.ok) {
        throw new Error(
          "No se pudo generar el PDF."
        );
      }

      const contentType =
        respuesta.headers.get("content-type");

      if (
        !contentType?.includes(
          "application/pdf"
        )
      ) {
        throw new Error(
          "El servidor no devolvió un PDF válido."
        );
      }

      const blobOriginal =
        await respuesta.blob();

      const blob = new Blob(
        [blobOriginal],
        {
          type: "application/pdf",
        }
      );

      const url =
        window.URL.createObjectURL(blob);

      const enlace =
        document.createElement("a");

      enlace.href = url;
      enlace.download = `Presupuesto-${String(
        numero
      ).padStart(4, "0")}.pdf`;

      document.body.appendChild(enlace);

      enlace.click();
      enlace.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);

      alert(
        "No se pudo descargar el presupuesto en PDF."
      );
    } finally {
      setDescargando(false);
    }
  }

  return (
    <Button
      type="button"
      onClick={descargar}
      disabled={descargando}
    >
      <FileText className="h-4 w-4 mr-2" />

      {descargando
        ? "Generando PDF..."
        : "Descargar PDF"}
    </Button>
  );
}