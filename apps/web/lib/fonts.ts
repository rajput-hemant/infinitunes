import {
  Hanken_Grotesk,
  Inter,
  JetBrains_Mono,
  Noto_Sans_Devanagari,
  Nunito,
  Source_Serif_4,
} from "next/font/google";
import localFont from "next/font/local";

/*
 * Each face owns a custom property; `styles/globals.css` maps `data-font` and
 * `data-heading-font` onto `--font-sans` and `--font-heading`, so switching
 * fonts needs no re-render. Only the default faces (Inter, Cal Sans,
 * Devanagari) are preloaded; the others are declared but fetched the first
 * time a selected font actually renders. All Latin faces are variable fonts,
 * so one file covers every weight.
 */

export const fontInter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const fontNunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export const fontHankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken-grotesk",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export const fontSourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export const fontMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export const fontSansDevanagari = Noto_Sans_Devanagari({
  variable: "--font-sans-devanagari",
  subsets: ["devanagari", "latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

export const fontCalSans = localFont({
  src: "../public/fonts/CalSans-SemiBold.woff",
  variable: "--font-cal-sans",
  display: "swap",
});
