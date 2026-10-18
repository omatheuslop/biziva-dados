import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Biziva Dados",
  description: "Modelagem de dados com assistência de IA e revisão local.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
