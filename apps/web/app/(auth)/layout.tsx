import { X } from "lucide-react";
import Link from "next/link";
import React from "react";

import { Icons } from "~/components/icons";
import { controlStyles } from "~/lib/control-styles";
import { cn } from "~/lib/utils";

import { AuthModeToggle } from "./_components/auth-mode-toggle";

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
  "/images/artists/0.png",
  "/images/artists/1.png",
];

type AuthLayoutProps = React.PropsWithChildren;

// Signed-in redirects live in each page (`redirectIfSignedIn`), because
// `/reset-password?token=...` must stay reachable for a signed-in user. They
// read the session at request time, so the auth pages opt out of validation.
// TODO: Cache Components adoption. Move the session read behind Suspense.
export const instant = false;

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="grid min-h-dvh md:grid-cols-[1.1fr_1fr]">
      <div className="relative sticky top-0 hidden h-dvh overflow-hidden bg-black p-2 md:grid md:grid-cols-3 md:content-start md:gap-2">
        {ART_IMAGES.map((src, i) => (
          <img
            key={i}
            src={src}
            alt=""
            className="aspect-square w-full rounded-(--r-sm) object-cover opacity-85"
          />
        ))}
        <div className="absolute inset-x-6 bottom-6 rounded-(--r-lg) bg-[rgba(20,20,22,0.45)] p-6 text-white backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
          <h2 className="font-heading text-[1.75rem] font-bold leading-[1.15] tracking-[-0.025em]">
            Millions of songs.
            <br />
            Zero cost.
          </h2>
          <p className="mt-2 text-sm text-white/75">
            Stream Hindi, English, Punjabi and more, in up to 320kbps.
          </p>
        </div>
      </div>

      <div className="relative flex min-h-dvh w-full items-center justify-center p-6 sm:p-8">
        <Link
          href="/"
          aria-label="Close"
          className={cn(
            controlStyles.headerIcon,
            "absolute left-4 top-4 flex items-center justify-center text-muted-foreground outline-none hover:text-foreground",
          )}
        >
          <X className="size-4" />
        </Link>

        <AuthModeToggle />

        <div className="w-full max-w-[352px] space-y-4">
          <div className="flex justify-center pb-2">
            <Link
              href="/"
              aria-label="Infinitunes home"
              className="flex items-center gap-2"
            >
              <Icons.Logo className="size-8" />
              <span className="font-heading text-lg font-bold">
                infinitunes
              </span>
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
