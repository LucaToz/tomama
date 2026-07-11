import {
  Permanent_Marker,
  Special_Elite,
  JetBrains_Mono,
  Rubik_Distressed,
} from "next/font/google";

// Titoli
export const permanentMarker = Permanent_Marker({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-marker",
});

export const rubikDistressed = Rubik_Distressed({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-rubik",
});

// Testo diario / lyrics
export const specialElite = Special_Elite({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-elite",
});

// Label / utility / note
export const jetBrainsMono = JetBrains_Mono({
  weight: ["400", "600"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});
