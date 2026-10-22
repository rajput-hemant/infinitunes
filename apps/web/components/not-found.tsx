import { buttonVariants } from "@infinitunes/ui/components/button";
import { Home, Search } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import React from "react";

import { GlassSurface } from "~/components/glass/glass-surface";
import { controlStyles } from "~/lib/control-styles";
import { cn } from "~/lib/utils";

const LINKS: { title: string; href: Route }[] = [
  {
    title: "Top Charts",
    href: "/chart",
  },
  {
    title: "Featured Playlists",
    href: "/playlist",
  },
  {
    title: "New Releases",
    href: "/album",
  },
  {
    title: "Radio Stations",
    href: "/radio",
  },
];

/** The 404 body, shared by the root and `(root)` not-found files. */
export function NotFoundBody({ className }: { className?: string }) {
  return (
    <div
      className={cn("flex flex-col items-center justify-center p-4", className)}
    >
      <GlassSurface
        size="l"
        lens="off"
        className="flex w-full max-w-lg flex-col items-center rounded-(--radius) px-4 py-16 text-center"
      >
        <div className="font-heading text-7xl font-extrabold leading-none tracking-[-0.05em] text-transparent bg-gradient-to-br from-primary to-foreground bg-clip-text">
          404
        </div>

        <h1 className="mt-4 font-heading text-xl font-bold leading-7 text-foreground">
          This page took a wrong turn
        </h1>

        <p className="mt-2 text-sm leading-5 text-muted-foreground">
          The link may be broken, or the page may have moved.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Link href="/" className={cn(buttonVariants(), controlStyles.text)}>
            <Home className="mr-2 size-4" />
            Go home
          </Link>
          <Link
            href="/search"
            className={cn(
              buttonVariants({ variant: "outline" }),
              controlStyles.text,
            )}
          >
            <Search className="mr-2 size-4" />
            Search
          </Link>
        </div>

        <div className="mt-8 border-t border-border pt-6">
          <p className="text-xs text-muted-foreground">Or try one of these:</p>
          <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs">
            {LINKS.map(({ title, href }, i, arr) => (
              <React.Fragment key={title}>
                <Link
                  href={href}
                  className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  {title}
                </Link>
                {i !== arr.length - 1 && (
                  <span aria-hidden className="text-muted-foreground/50">
                    /
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </GlassSurface>
    </div>
  );
}
