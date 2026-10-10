// oxlint-disable-next-line import/no-unassigned-import -- global stylesheet is a side-effect import
import "~/styles/globals.css";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import type React from "react";

import Providers from "~/components/provider";
import { TailwindIndicator } from "~/components/tailwind-indicator";
import { siteConfig } from "~/config/site";
import { env } from "~/lib/env";
import * as fonts from "~/lib/fonts";
import { THEME_COLOR } from "~/lib/theme-color";
import { DEFAULT_THEME_CONFIG } from "~/lib/theme-config";
import { THEME_BOOTSTRAP_SCRIPT } from "~/lib/theme-script";
import { themeConfigToHtml } from "~/lib/theme/html";
import { absoluteUrl, cn } from "~/lib/utils";

type RootLayoutProps = {
  modal: React.ReactNode;
  children: React.ReactNode;
};

// Static defaults: the saved appearance is applied before first paint by
// `THEME_BOOTSTRAP_SCRIPT`, so this layout never reads the cookie.
const { attributes: defaultThemeAttributes } =
  themeConfigToHtml(DEFAULT_THEME_CONFIG);

export default function RootLayout({ modal, children }: RootLayoutProps) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(Object.values(fonts).map((font) => font.variable))}
      {...defaultThemeAttributes}
    >
      <body className="min-h-screen font-sans antialiased">
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
        <Providers>
          {children}
          {modal}
        </Providers>

        <TailwindIndicator />
      </body>

      <Script
        async
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
