import { ProductoForm } from "@/components/stock/producto-form";

export default function NuevoProductoPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-neutral-900">Nuevo producto</h1>
      <ProductoForm modo="crear" />
    </div>
  );
}