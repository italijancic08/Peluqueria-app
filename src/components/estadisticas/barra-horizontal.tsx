type Props = {
  label: string;
  valor: number;
  maximo: number;
  valorFormateado: string;
};

export function BarraHorizontal({ label, valor, maximo, valorFormateado }: Props) {
  const porcentaje = maximo > 0 ? Math.round((valor / maximo) * 100) : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-[#4A3428]">{label}</span>
        <span className="text-[#9C8577]">{valorFormateado}</span>
      </div>
      <div className="h-2 rounded-full bg-[#F3E5D6] overflow-hidden">
        <div
          className="h-full rounded-full bg-[#6B4635]"
          style={{ width: `${porcentaje}%` }}
        />
      </div>
    </div>
  );
}