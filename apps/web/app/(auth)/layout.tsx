import { X } from "lucide-react";
import Link from "next/link";
import React from "react";

import { ArtistSpotlight } from "~/components/artist-spotlight";
import { Icons } from "~/components/icons";
import { controlStyles } from "~/lib/control-styles";
import { cn } from "~/lib/utils";

const ART_IMAGES = [
  "/images/artists/0.png",
  "/images/artists/1.png",
  "/images/artists/2.png",
  "/images/artists/3.png",
  "/images/artists/4.png",
  "/images/artists/5.png",
  "/images/artists/6.png",
  "/images/artists/7.png",
  "/images/artists/8.png",
  "/images/artists/9.png",
];

type AuthLayoutProps = React.PropsWithChildren;

// Signed-in redirects live in each page (`SignedInRedirect`, behind its own
// `<Suspense>`), because `/reset-password?token=...` must stay reachable for a
// signed-in user. The layout and the forms prerender; the redirect streams in.

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="grid min-h-dvh md:grid-cols-[1.1fr_1fr]">
      <div className="sticky top-0 hidden h-dvh overflow-hidden bg-black md:block">
        <ArtistSpotlight images={ART_IMAGES} />
        <div className="absolute inset-x-6 bottom-6 rounded-(--r-lg) bg-black/45 p-6 text-white inset-shadow-2xs inset-shadow-white/20">
          <h2 className="font-heading text-[1.75rem] font-bold leading-8 tracking-[-0.025em]">
            Millions of songs.
            <br />
            Zero cost.
          </h2>
          <p className="mt-2 text-sm text-white/75">
            Stream Hindi, English, Punjabi and more, in up to 320kbps.
          </p>
        </div>
      </div>

      <div className="relative grid min-h-dvh w-full place-items-center px-6 py-8">
        <Link
          href="/"
          aria-label="Close"
          className={cn(
            controlStyles.headerIcon,
            "absolute left-4 top-4 flex items-center justify-center text-muted-foreground outline-hidden hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          <X className="size-4" />
        </Link>

        <div className="grid w-full max-w-88 gap-4">
          <Link
            href="/"
            aria-label="Infinitunes home"
            className="mb-2 flex items-center gap-2 justify-self-start rounded-sm font-heading text-lg/6 font-bold tracking-tight lowercase"
          >
            <span className="grid size-7 shrink-0 place-items-center rounded-sm bg-primary text-primary-foreground">
              <Icons.Logo className="size-4" />
            </span>
            infinitunes
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
