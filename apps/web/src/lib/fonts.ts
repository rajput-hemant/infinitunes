import { Inter, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";

/* -----------------------------------------------------------------------------------------------
 * Google Fonts
 * -----------------------------------------------------------------------------------------------*/

export const fontSans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const fontMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

/* -----------------------------------------------------------------------------------------------
 * Local Fonts
 * -----------------------------------------------------------------------------------------------*/

export const fontHeading = localFont({
  src: "../../public/fonts/CalSans-SemiBold.woff",
  variable: "--font-heading",
});

// ...
