import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Há Caracóis 🐌 — Onde comer caracóis",
  description:
    "Descobre e partilha os melhores sítios para comer caracóis. Marca no mapa, avalia e adiciona os teus locais favoritos.",
  applicationName: "Há Caracóis",
  openGraph: {
    title: "Há Caracóis 🐌",
    description: "Descobre e partilha os melhores sítios para comer caracóis.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
