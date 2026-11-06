import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@fontsource/press-start-2p";
import "./globals.css";

export const metadata: Metadata = {
  title: "Biscoito da Sorte",
  description: "Um biscoito por dia. Quebra o seu.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-dvh font-pixel text-paper">{children}</body>
    </html>
  );
}
