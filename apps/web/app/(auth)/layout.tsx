import { buttonVariants } from "@infinitunes/ui/components/button";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import React from "react";

import { Icons } from "~/components/icons";
import { getUser } from "~/lib/auth";
import { asRoute, cn } from "~/lib/utils";

import { AuthModeToggle } from "./_components/auth-mode-toggle";

/** One artist image (0-9) per UTC day. */
function dailyArtistImage() {
  return `/images/artists/${Math.floor(Date.now() / 864e5) % 10}.png`;
}

type AuthLayoutProps = React.PropsWithChildren;

export default async function AuthLayout({ children }: AuthLayoutProps) {
  const user = await getUser();

  if (user) {
    redirect("/");
  }

  const imageUrl = dailyArtistImage();

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="hidden bg-zinc-900 p-10 text-white dark:border-r lg:flex lg:flex-col lg:justify-between">
        <Link
          href="/"
          className={cn(
            buttonVariants({ size: "sm" }),
            "group w-fit border border-zinc-600 duration-200 hover:ring-2 hover:ring-zinc-600 hover:ring-offset-2 hover:ring-offset-zinc-900",
          )}
        >
          <ArrowLeft className="mr-1 size-4 duration-300 group-hover:-translate-x-1" />
          Back
        </Link>

        <Image
          src={imageUrl}
          width={1280}
          height={640}
          alt=""
          className="mx-auto max-w-md object-cover duration-1000 animate-in zoom-in-50 motion-reduce:animate-none"
        />

        <div className="mb-20 text-center 2xl:mb-32">
          <p className="font-heading text-5xl">All Your Music.</p>
          <em className="text-2xl text-muted-foreground">Anytime, anywhere.</em>
        </div>
      </div>

      <AuthModeToggle />

      <main className="m-auto flex w-full flex-col justify-center space-y-6 p-8 sm:w-[350px] sm:p-0">
        <Link
          href="/"
          aria-label="Infinitunes home"
          className="mx-auto rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Icons.Logo className="size-14 drop-shadow-sm" />
        </Link>
        {children}
        <p className="mx-auto px-10 text-center text-sm text-muted-foreground">
          By clicking continue, you agree to our{" "}
          <Link
            href={asRoute("/terms")}
            className="underline underline-offset-4 outline-none hover:text-foreground hover:underline"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href={asRoute("/privacy")}
            className="underline underline-offset-4 outline-none hover:text-foreground hover:underline"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
