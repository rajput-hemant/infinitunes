import { buttonVariants } from "@infinitunes/ui/components/button";
import { Skeleton } from "@infinitunes/ui/components/skeleton";
import { Edit, Mail } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import React from "react";

import { ImageWithFallback } from "~/components/image-with-fallback";
import { getUser } from "~/lib/auth";
import { controlStyles } from "~/lib/control-styles";
import { cn } from "~/lib/utils";

import { LogoutButton } from "./_components/logout";
import { Navbar } from "./_components/navbar";

export default async function Layout({ children }: React.PropsWithChildren) {
  const user = await getUser();

  // The proxy only checks that a session cookie exists; a stale one lands here.
  if (!user) {
    redirect("/login");
  }

  return (
    <section className="flex flex-col gap-(--page-gap)">
      <header className="flex flex-col items-center gap-5 sm:flex-row">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-full border">
          <ImageWithFallback
            src={user.image || "/images/placeholder/user.jpg"}
            fallback="/images/placeholder/user.jpg"
            alt=""
            fill
            className={cn("rounded-full p-1", !user.image && "dark:invert")}
          />

          <Skeleton className="absolute inset-1 -z-10 rounded-full" />
        </div>

        <div className="min-w-0 flex-1 text-center sm:text-start">
          <h1 className="truncate font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {user.name ?? "User"}
          </h1>

          <p className="truncate text-muted-foreground">
            <Mail aria-hidden className="mr-1 inline-block size-4" />
            {user.email ?? "you@example.com"}
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/settings#profile"
            className={buttonVariants({
              variant: "secondary",
              className: controlStyles.text,
            })}
          >
            <Edit aria-hidden className="mr-2 size-4" /> Edit
          </Link>

          <LogoutButton />
        </div>
      </header>

      <Navbar />

      <div className="min-h-120">{children}</div>
    </section>
  );
}
