const PLACEHOLDER = [
  { nombre: "P1", inicial: "C", color: "#E8C7A6" },
  { nombre: "P2", inicial: "E", color: "#D9B896" },
];

/** Sección puramente visual — todavía no está conectada a datos reales de empleados. */
export function PeluquerasShowcase() {
  return (
    <div className="text-center">
      <h2 className="text-sm font-medium text-[#4A3428] mb-3">Nuestro equipo</h2>
      <div className="flex justify-center gap-4">
        {PLACEHOLDER.map((p) => (
          <div key={p.nombre} className="flex flex-col items-center gap-1.5">
            <span
              className="flex h-14 w-14 items-center justify-center rounded-full text-white font-semibold font-[family-name:var(--font-display)]"
              style={{ backgroundColor: p.color }}
            >
              {p.inicial}
            </span>
            <span className="text-xs text-[#4A3428]">{p.nombre}</span>
          </div>
        ))}
      </div>
    </div>
  );
}