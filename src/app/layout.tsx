import type { Metadata, Viewport } from "next";
import { Playfair_Display } from "next/font/google";
import "./globals.css";

const display = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://estefaniamartyn.com"),
  title: "Estefanía Martyn | Peluquería",
  description: "Reservá tu turno online de forma rápida y sencilla",
  openGraph: {
    title: "Estefanía Martyn | Peluquería",
    description: "Reservá tu turno online de forma rápida y sencilla",
    url: "https://estefaniamartyn.com",
    siteName: "Estefanía Martyn",
    type: "website",
    locale: "es_AR",
    images: [{ url: "/logo.png", alt: "Estefanía Martyn Peluquería" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#6B4635",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={display.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}