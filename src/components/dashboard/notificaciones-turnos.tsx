import {
  AlertaCancelacionCliente,
  type CancelacionClienteItem,
} from "./alerta-cancelacion-cliente";
import {
  AlertaReprogramacionCliente,
  type ReprogramacionClienteItem,
} from "./alerta-reprogramacion-cliente";

type Props = {
  cancelaciones: CancelacionClienteItem[];
  reprogramaciones: ReprogramacionClienteItem[];
};

export function NotificacionesTurnos({ cancelaciones, reprogramaciones }: Props) {
  if (cancelaciones.length === 0 && reprogramaciones.length === 0) return null;

  return (
    <div className="space-y-3">
      {reprogramaciones.map((r) => (
        <AlertaReprogramacionCliente key={r.id} item={r} />
      ))}
      {cancelaciones.map((c) => (
        <AlertaCancelacionCliente key={c.id} item={c} />
      ))}
    </div>
  );
}