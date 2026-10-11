import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { checkAuth } from "@/lib/auth/guards";
import { generarPdfComprobante } from "@/lib/pdf/comprobante";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ workId: string }> }
) {
  const { workId } = await params;

  const perfil = await checkAuth();

  if (!perfil) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const supabase = await createClient();
  const pdf = await generarPdfComprobante(supabase, workId);

  if (!pdf.ok) {
    return NextResponse.json({ error: pdf.error }, { status: pdf.status });
  }

  return new NextResponse(new Uint8Array(pdf.bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${pdf.nombreArchivo}"`,
      "Cache-Control": "no-store",
    },
  });
}