import "@/styles/globals.css";

import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import { fontSans, incognito, overpass, poppins } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import Player from "@/components/player";
import Providers from "@/components/provider";
import Sidebar from "@/components/sidebar";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import { TailwindIndicator } from "@/components/tailwind-indicator";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    //...
  ],
  authors: [siteConfig.me],
  creator: siteConfig.me.name,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: "/images/screenshot.png",
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: "@rajput_hemant01",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

type Props = {
  children: React.ReactNode;
};

const RootLayout = ({ children }: Props) => {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />

      <body
        className={cn(
          "min-h-screen font-sans",
          fontSans.variable,
          poppins.variable,
          overpass.variable,
          incognito.variable
        )}
      >
        <Providers>
          <SiteHeader />

          <Sidebar className="fixed left-0 top-14 hidden h-full w-1/5 border-r lg:block xl:w-[15%]" />

          <main className="pb-36 lg:ml-[20%] lg:pb-20 xl:ml-[15%]">
            {children}

            <SiteFooter />
          </main>

          <Player />
        </Providers>

        <TailwindIndicator />
      </body>
    </html>
  );
};

export default RootLayout;
