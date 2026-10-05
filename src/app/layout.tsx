import type { Metadata } from "next";
import { Archivo, Barlow } from "next/font/google";
import { BRAND } from "@/lib/brand";
import { TAGLINE } from "@/lib/copy/common";
import "./globals.css";

/*
 * Fontes do manual da marca (pág. 06-Tipografia):
 * display = Archivo — ExtraBold 800, eixo wdth exposto para o stretch
 * de 118% aplicado em @utility font-display (globals.css).
 * texto   = Barlow — 400/600/700, só os pesos autorizados, para não
 * carregar arquivo inútil em 4G. Os números tabulares do app saem do
 * próprio Barlow (o manual não define fonte mono).
 */
const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  weight: "variable",
  display: "swap",
  variable: "--font-archivo",
});

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-barlow",
});

/** Metadata derivada de BRAND — nunca literal (04-landing.md). */
export const metadata: Metadata = {
  metadataBase: new URL(`https://${BRAND.domain}`),
  title: {
    default: `${BRAND.name} — ${TAGLINE}`,
    template: `%s — ${BRAND.name}`,
  },
  description: TAGLINE,
  applicationName: BRAND.name,
  openGraph: {
    siteName: BRAND.name,
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className={`${archivo.variable} ${barlow.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
