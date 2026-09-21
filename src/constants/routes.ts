export const RUTAS = {
  inicio: "/",
  reservar: "/turnos",
  login: "/login",

  dashboard: "/dashboard",
  clientes: "/clientes",
  cliente: (id: string) => `/clientes/${id}`,
  agenda: "/agenda",
  presupuestos: "/presupuestos",
  trabajos: "/trabajos",
  trabajosDisponibles: "/trabajos/disponibles",
  trabajo: (id: string) => `/trabajos/${id}`,
  stock: "/stock",
  caja: "/caja",
  liquidaciones: "/liquidaciones",
  documentos: "/documentos",

  empleados: "/empleados",
  servicios: "/servicios",
  estadisticas: "/estadisticas",
  configuracion: "/configuracion",
} as const;