import type { Metadata, Viewport } from "next";
import "./globals.css";
import { permanentMarker, specialElite, jetBrainsMono, rubikDistressed } from "./fonts";
import { getSiteUrl } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: "Tomama — pezzi nuovi",
  description: "I pezzi nuovi non sono ancora online. Se eri lì, lo sai.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#17140f",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const fontVars = [
    permanentMarker.variable,
    specialElite.variable,
    jetBrainsMono.variable,
    rubikDistressed.variable,
  ].join(" ");

  return (
    <html lang="it" className={fontVars}>
      <body>{children}</body>
    </html>
  );
}
