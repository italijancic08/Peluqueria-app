import type { NextConfig } from "next";

const esDesarrollo = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Solo en desarrollo; en producción se usa el mismo origen del sitio
      allowedOrigins: esDesarrollo
        ? ["localhost:3000", "*.app.github.dev", "*.githubpreview.dev"]
        : [],
    },
  },
  // Los PDF leen public/logo.png con fs: se asegura que viaje con las funciones
  outputFileTracingIncludes: {
    "/api/**/*": ["./public/logo.png"],
    "/**/*": ["./public/logo.png"],
  },
};

export default nextConfig;