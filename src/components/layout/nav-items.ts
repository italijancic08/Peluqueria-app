import {
  LayoutDashboard,
  Users,
  CalendarDays,
  FileText,
  Scissors,
  Package,
  Wallet,
  HandCoins,
  UserCog,
  Sparkles,
  ChartBar,
  Settings2,
  type LucideIcon,
} from "lucide-react";
import { RUTAS } from "@/constants/routes";
import type { UserRole } from "@/types/models";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  soloAdmin?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: RUTAS.dashboard, icon: LayoutDashboard },
  { label: "Clientes", href: RUTAS.clientes, icon: Users },
  { label: "Turnos", href: RUTAS.agenda, icon: CalendarDays },
  { label: "Presupuestos", href: RUTAS.presupuestos, icon: FileText },
  { label: "Trabajos", href: RUTAS.trabajos, icon: Scissors },
  { label: "Stock", href: RUTAS.stock, icon: Package },
  { label: "Caja", href: RUTAS.caja, icon: Wallet },
  { label: "Liquidaciones", href: RUTAS.liquidaciones, icon: HandCoins },
  { label: "Empleados", href: RUTAS.empleados, icon: UserCog, soloAdmin: true },
  { label: "Servicios", href: RUTAS.servicios, icon: Sparkles, soloAdmin: true },
  { label: "Estadísticas", href: RUTAS.estadisticas, icon: ChartBar, soloAdmin: true },
  { label: "Configuración", href: RUTAS.configuracion, icon: Settings2, soloAdmin: true },
];

export function navParaRol(rol: UserRole): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.soloAdmin || rol === "ADMIN");
}