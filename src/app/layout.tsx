import type { Metadata, Viewport } from "next";
import { Anton, Barlow_Condensed, Inter, Permanent_Marker } from "next/font/google";

import Navbar from "@/components/nav/navbar";
import PerfBoot from "@/components/perf/perf-boot";
import SocialFab from "@/components/ui/social-fab";
import "./globals.css";

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
  display: "swap",
});

const marker = Permanent_Marker({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-marker",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const barlow = Barlow_Condensed({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  variable: "--font-barlow",
  display: "swap",
});

export const metadata: Metadata = {
  title: "JML Sports — Fotografia Esportiva | Jamal",
  description:
    "Congelando histórias além do tatame. Cobertura fotográfica de campeonatos de Jiu-Jitsu e esportes de combate no Rio de Janeiro.",
  // favicon e apple-icon vêm da convenção do App Router (src/app/icon.png e
  // apple-icon.png, gerados por `npm run images` a partir de logo_bg.png)
  openGraph: {
    title: "JML Sports — Fotografia Esportiva",
    description: "Congelando histórias além do tatame. Cobertura esportiva por Jamal.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className={`${anton.variable} ${marker.variable} ${inter.variable} ${barlow.variable}`}
    >
      <body className="bg-ink-900 text-white antialiased">
        <PerfBoot />
        <Navbar />
        {children}
        <SocialFab />
      </body>
    </html>
  );
}
