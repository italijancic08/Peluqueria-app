import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductoForm } from "@/components/stock/producto-form";
import { MovimientoStockForm } from "@/components/stock/movimiento-stock-form";

export default async function EditarProductoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: producto } = await supabase.from("products").select("*").eq("id", id).single();

  if (!producto) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-neutral-900">Editar producto</h1>
      <ProductoForm modo="editar" producto={producto} />

      <div className="pt-4 border-t border-neutral-200 max-w-lg">
        <h2 className="text-sm font-medium text-neutral-700 mb-2">Movimiento de stock</h2>
        <MovimientoStockForm producto={producto} />
      </div>
    </div>
  );
}