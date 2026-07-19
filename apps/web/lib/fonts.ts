import { Inter, JetBrains_Mono, Noto_Sans_Devanagari } from "next/font/google";
import localFont from "next/font/local";

/* -----------------------------------------------------------------------------------------------
 * Google Fonts
 * -----------------------------------------------------------------------------------------------*/

export const fontSans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const fontSansDevanagari = Noto_Sans_Devanagari({
  variable: "--font-sans-devanagari",
  subsets: ["devanagari", "latin"],
  weight: ["400", "600", "700"],
});

export const fontMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

/* -----------------------------------------------------------------------------------------------
 * Local Fonts
 * -----------------------------------------------------------------------------------------------*/

export const fontHeading = localFont({
  src: "../public/fonts/CalSans-SemiBold.woff",
  variable: "--font-heading",
});

// ...
