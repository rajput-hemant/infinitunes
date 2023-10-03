import {
  JetBrains_Mono as FontMono,
  Inter as FontSans,
  Overpass,
  Poppins,
} from "next/font/google";
import localFont from "next/font/local";

/* -----------------------------------------------------------------------------------------------
 * Google Fonts
 * -----------------------------------------------------------------------------------------------*/

export const fontSans = FontSans({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const fontMono = FontMono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const overpass = Overpass({
  variable: "--font-overpass",
  subsets: ["latin"],
  display: "swap",
});

/* -----------------------------------------------------------------------------------------------
 * Local Fonts
 * -----------------------------------------------------------------------------------------------*/

export const incognito = localFont({
  variable: "--font-incognito",
  display: "swap",
  src: [
    {
      path: "../../public/fonts/incognito_bold.woff2",
      weight: "800",
      style: "normal",
    },
    {
      path: "../../public/fonts/incognito_condensed.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/incognito_medium.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/incognito_regular.woff2",
      weight: "400",
      style: "normal",
    },
  ],
});
