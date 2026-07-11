import "./globals.css";
import { permanentMarker, caveat, specialElite, jetBrainsMono, rubikDistressed } from "./fonts";

export const metadata = {
  title: "Tomama — pezzi nuovi",
  description: "I pezzi nuovi non sono ancora online. Se eri lì, lo sai.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#17140f",
};

export default function RootLayout({ children }) {
  const fontVars = [
    permanentMarker.variable,
    caveat.variable,
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
