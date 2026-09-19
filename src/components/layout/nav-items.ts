import { RUTAS } from "@/constants/routes";
import type { UserRole } from "@/types/models";

export type NavItem = {
  label: string;
  href: string;
  soloAdmin?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: RUTAS.dashboard },
  { label: "Clientes", href: RUTAS.clientes },
  { label: "Turnos", href: RUTAS.agenda },
  { label: "Presupuestos", href: RUTAS.presupuestos },
  { label: "Trabajos", href: RUTAS.trabajos },
  { label: "Stock", href: RUTAS.stock },
  { label: "Caja", href: RUTAS.caja },
  { label: "Liquidaciones", href: RUTAS.liquidaciones },
  { label: "Empleados", href: RUTAS.empleados, soloAdmin: true },
  { label: "Servicios", href: RUTAS.servicios, soloAdmin: true },
  { label: "Estadísticas", href: RUTAS.estadisticas, soloAdmin: true },
  { label: "Configuración", href: RUTAS.configuracion, soloAdmin: true },
];

export function navParaRol(rol: UserRole): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.soloAdmin || rol === "ADMIN");
}