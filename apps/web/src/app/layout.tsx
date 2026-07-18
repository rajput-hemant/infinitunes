import "@/styles/globals.css";

import React from "react";
import { cookies } from "next/headers";
import Script from "next/script";

import type { Metadata, Viewport } from "next";
import type { ThemeConfig } from "@/types";

import Providers from "@/components/provider";
import { TailwindIndicator } from "@/components/tailwind-indicator";
import { siteConfig } from "@/config/site";
import { env } from "@/lib/env";
import * as fonts from "@/lib/fonts";
import { absoluteUrl, cn } from "@/lib/utils";

type RootLayoutProps = {
  modal: React.ReactNode;
  children: React.ReactNode;
};

export default async function RootLayout({ modal, children }: RootLayoutProps) {
  const cookieStore = await cookies();
  const themeConfig = cookieStore.get("theme-config");

  const { theme, radius } = JSON.parse(
    themeConfig?.value ?? '{"theme":"default","radius":"default"}'
  ) as ThemeConfig;

  return (
    <React.StrictMode>
      <html lang="en" suppressHydrationWarning>
        <body
          className={cn(
            Object.values(fonts).map((font) => font.variable),
            "min-h-screen font-sans antialiased",
            `theme-${theme}`
          )}
          style={
            radius === "default" ?
              {}
            : ({ "--radius": `${radius}rem` } as React.CSSProperties)
          }
        >
          <Providers>
            {children}
            {modal}
          </Providers>

          <TailwindIndicator />
        </body>

        {/* Umami Analytics */}
        <Script
          async
          src="https://us.umami.is/script.js"
          data-website-id={env.UMAMI_WEBSITE_ID}
        />
      </html>
    </React.StrictMode>
  );
}

export const viewport: Viewport = {
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    creator: siteConfig.author.x,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-icon.png", type: "image/png" }],
  },
  metadataBase: new URL(absoluteUrl("/")),
};
