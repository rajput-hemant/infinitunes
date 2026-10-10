"use client";

// oxlint-disable-next-line import/no-unassigned-import -- global stylesheet is a side-effect import
import "~/styles/globals.css";
import type { RouteErrorProps } from "~/components/route-error";
import { RouteError } from "~/components/route-error";
import { siteConfig } from "~/config/site";
import * as fonts from "~/lib/fonts";
import { cn } from "~/lib/utils";

// Replaces the root layout, so it renders its own document. It takes no
// providers and fetches nothing; the stylesheet and fonts are repeated here.
export default function GlobalError(props: Omit<RouteErrorProps, "height">) {
  return (
    <html
      lang="en"
      className={cn(Object.values(fonts).map((font) => font.variable))}
    >
      <head>
        <title>{`Something went wrong | ${siteConfig.name}`}</title>
      </head>
      <body className="min-h-screen font-sans antialiased">
        <RouteError {...props} height="screen" />
      </body>
    </html>
  );
}
