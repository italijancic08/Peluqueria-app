import {
  AlertaCancelacionCliente,
  type CancelacionClienteItem,
} from "./alerta-cancelacion-cliente";
import { AlertaEmailFallido, type EmailFallidoItem } from "./alerta-email-fallido";
import {
  AlertaReprogramacionCliente,
  type ReprogramacionClienteItem,
} from "./alerta-reprogramacion-cliente";

type Props = {
  cancelaciones: CancelacionClienteItem[];
  reprogramaciones: ReprogramacionClienteItem[];
  emailsFallidos: EmailFallidoItem[];
};

export function NotificacionesTurnos({ cancelaciones, reprogramaciones, emailsFallidos }: Props) {
  if (cancelaciones.length === 0 && reprogramaciones.length === 0 && emailsFallidos.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {reprogramaciones.map((r) => (
        <AlertaReprogramacionCliente key={r.id} item={r} />
      ))}
      {cancelaciones.map((c) => (
        <AlertaCancelacionCliente key={c.id} item={c} />
      ))}
      {emailsFallidos.map((m) => (
        <AlertaEmailFallido key={m.id} item={m} />
      ))}
    </div>
  );
}