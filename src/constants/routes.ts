export const RUTAS = {
  inicio: "/",
  reservar: "/turnos",
  login: "/login",

  dashboard: "/dashboard",
  clientes: "/clientes",
  cliente: (id: string) => `/clientes/${id}`,
  turnos: "/turnos",
  presupuestos: "/presupuestos",
  trabajos: "/trabajos",
  trabajosDisponibles: "/trabajos/disponibles",
  trabajo: (id: string) => `/trabajos/${id}`,
  stock: "/stock",
  caja: "/caja",
  liquidaciones: "/liquidaciones",

  empleados: "/empleados",
  servicios: "/servicios",
  estadisticas: "/estadisticas",
  configuracion: "/configuracion",
} as const;