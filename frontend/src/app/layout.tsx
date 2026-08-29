import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Freight Pilot",
  description: "Demo that turns freight messages into clear requests ready for quotation.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
