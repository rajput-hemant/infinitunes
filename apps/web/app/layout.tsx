// oxlint-disable-next-line import/no-unassigned-import -- global stylesheet is a side-effect import
import "~/styles/globals.css";
import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import Script from "next/script";
import type React from "react";

import Providers from "~/components/provider";
import { TailwindIndicator } from "~/components/tailwind-indicator";
import { siteConfig } from "~/config/site";
import { env } from "~/lib/env";
import * as fonts from "~/lib/fonts";
import { THEME_COLOR } from "~/lib/theme-color";
import { themeConfigToHtml } from "~/lib/theme/html";
import { getThemeConfig } from "~/lib/theme/server";
import { absoluteUrl, cn } from "~/lib/utils";

type RootLayoutProps = {
  modal: React.ReactNode;
  children: React.ReactNode;
};

export default async function RootLayout({ modal, children }: RootLayoutProps) {
  const themeConfig = await getThemeConfig();
  const { attributes, style } = themeConfigToHtml(themeConfig);
  // Per-request CSP nonce set by `proxy.ts`; absent when the proxy did not run.
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    // The cookie is read here, so <html> is themed on first paint; the client
    // provider keeps these attributes in step with live changes.
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(Object.values(fonts).map((font) => font.variable))}
      style={style as React.CSSProperties}
      {...attributes}
    >
      <body className="min-h-screen font-sans antialiased">
        <Providers nonce={nonce} themeConfig={themeConfig}>
          {children}
          {modal}
        </Providers>

        <TailwindIndicator />
      </body>

      <Script
        async
        nonce={nonce}
        src="https://us.umami.is/script.js"
        data-website-id={env.UMAMI_WEBSITE_ID}
      />
    </html>
  );
}

export const viewport: Viewport = {
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: THEME_COLOR.light },
    { media: "(prefers-color-scheme: dark)", color: THEME_COLOR.dark },
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
    ],
    apple: [{ url: "/apple-icon.png", type: "image/png" }],
  },
  metadataBase: new URL(absoluteUrl("/")),
};
