import { formatearPesos } from "@/lib/format";
import { precioTarjeta } from "@/lib/precios";

type Props = {
  /** Precio en efectivo/transferencia. */
  precio: number | string;
  recargoPct: number;
  desde?: boolean;
};

/** Muestra juntos el precio en efectivo/transferencia y el de tarjeta. */
export function PreciosDuales({ precio, recargoPct, desde }: Props) {
  return (
    <span className="flex flex-col items-end text-xs leading-tight text-[#9C8577]">
      <span>
        Efectivo/transf.{" "}
        <span className="font-medium text-[#4A3428]">
          {desde ? "desde " : ""}
          {formatearPesos(precio)}
        </span>
      </span>
      <span>
        Tarjeta{" "}
        <span className="font-medium text-[#4A3428]">
          {desde ? "desde " : ""}
          {formatearPesos(precioTarjeta(precio, recargoPct))}
        </span>
      </span>
    </span>
  );
}