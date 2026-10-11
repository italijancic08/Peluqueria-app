import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CodigoTurno } from "@/components/turnos/codigo-turno";

export default async function ConfirmacionTurnoPage({
  searchParams,
}: {
  searchParams: Promise<{ numero?: string; token?: string; codigo?: string }>;
}) {
  const { numero, token, codigo } = await searchParams;
  const tokenValido = token && /^[a-f0-9]{64}$/.test(token) ? token : null;
  const codigoValido = codigo && /^[A-HJ-NP-Z2-9]{6}$/.test(codigo) ? codigo : null;

  return (
    <div className="min-h-screen flex items-start sm:items-center justify-center py-6 sm:py-10 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-[#EDD9C4] p-5 sm:p-8 text-center space-y-4">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EEF1E3]">
          <CheckCircle2 className="h-6 w-6 text-[#5C6640]" />
        </span>

        <h1 className="text-xl font-semibold text-[#4A3428] font-[family-name:var(--font-display)]">
          ¡Turno reservado!
        </h1>

        {numero && (
          <p className="text-sm text-[#4A3428]">
            Tu número de turno es <span className="font-semibold">#{numero}</span>.
          </p>
        )}
        <p className="text-sm text-[#9C8577]">Te esperamos en el horario elegido.</p>

        {codigoValido && <CodigoTurno codigo={codigoValido} />}

        {tokenValido && (
          <div className="space-y-2 rounded-xl border border-[#EDD9C4] bg-[#FBF3EA] p-4">
            <p className="text-sm text-[#4A3428]">
              Si necesitás cancelar o cambiar el horario, podés hacerlo desde acá o ingresando tu
              código en “Gestionar turno”.
            </p>
            <Link href={`/turnos/gestionar/${tokenValido}`}>
              <Button variant="secondary" className="w-full">
                Gestionar mi turno
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}