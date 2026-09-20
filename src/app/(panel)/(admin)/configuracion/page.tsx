import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BusinessSettingsForm } from "@/components/configuracion/business-settings-form";

export default async function ConfiguracionPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("business_settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (!settings) {
    return <p className="text-sm text-red-600">No se pudo cargar la configuración.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900">Configuración</h1>
        <Link href="/configuracion/horarios" className="text-sm text-neutral-900 underline">
          Editar horarios de atención
        </Link>
      </div>
      <BusinessSettingsForm settings={settings} />
    </div>
  );
}