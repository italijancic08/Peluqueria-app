import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Peluquería",
  description: "Sistema de gestión",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="antialiased bg-neutral-50 text-neutral-900">
        {children}
      </body>
    </html>
  );
}