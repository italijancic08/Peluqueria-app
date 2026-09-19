export default async function ConfirmacionTurnoPage({
  searchParams,
}: {
  searchParams: Promise<{ numero?: string }>;
}) {
  const { numero } = await searchParams;

  return (
    <div className="max-w-md mx-auto py-16 px-4 text-center space-y-3">
      <h1 className="text-xl font-semibold text-neutral-900">¡Turno reservado!</h1>
      {numero && (
        <p className="text-sm text-neutral-600">
          Tu número de turno es <span className="font-semibold">#{numero}</span>.
        </p>
      )}
      <p className="text-sm text-neutral-500">Te esperamos en el horario elegido.</p>
    </div>
  );
}