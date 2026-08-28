import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Freight Pilot",
  description: "Demo que transforma mensajes de transporte en solicitudes claras y listas para cotizar.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
