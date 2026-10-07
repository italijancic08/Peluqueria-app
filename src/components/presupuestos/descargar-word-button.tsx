"use client";

import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DescargarWordButton({
  presupuestoId,
  numero,
}: {
  presupuestoId: string;
  numero: number;
}) {
  async function descargar() {
    const respuesta = await fetch(
      `/api/presupuestos/${presupuestoId}/word`
    );

    if (!respuesta.ok) {
      return;
    }

    const blob = await respuesta.blob();

    const url = window.URL.createObjectURL(blob);
    const enlace = document.createElement("a");

    enlace.href = url;
    enlace.download = `Presupuesto-${numero}.docx`;

    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();

    window.URL.revokeObjectURL(url);
  }

  return (
    <Button type="button" onClick={descargar}>
      <FileText className="h-4 w-4 mr-2" />
      Descargar Word
    </Button>
  );
}