type Empleado = { id: string; nombre: string; apellido: string; foto_url: string | null };

const COLORES = ["#E8C7A6", "#D9B896", "#F3E5D6", "#C9A876", "#E0CBAE"];

export function PeluquerasShowcase({ equipo }: { equipo: Empleado[] }) {
  if (equipo.length === 0) return null;

  return (
    <div className="text-center">
      <h2 className="text-sm font-medium text-[#4A3428] mb-3">Nuestro equipo</h2>
      <div className="flex justify-center flex-wrap gap-4">
        {equipo.map((e, i) => {
          const inicial = e.nombre.trim().charAt(0).toUpperCase() || "?";
          return (
            <div key={e.id} className="flex flex-col items-center gap-1.5">
              {e.foto_url ? (
                <img
                  src={e.foto_url}
                  alt={e.nombre}
                  className="h-14 w-14 rounded-full object-cover"
                />
              ) : (
                <span
                  className="flex h-14 w-14 items-center justify-center rounded-full text-white font-semibold font-[family-name:var(--font-display)]"
                  style={{ backgroundColor: COLORES[i % COLORES.length] }}
                >
                  {inicial}
                </span>
              )}
              <span className="text-xs text-[#4A3428]">{e.nombre}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}