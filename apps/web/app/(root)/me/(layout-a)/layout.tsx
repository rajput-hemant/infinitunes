import { buttonVariants } from "@infinitunes/ui/components/button";
import { Skeleton } from "@infinitunes/ui/components/skeleton";
import { Edit, Mail } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import React from "react";

import { ImageWithFallback } from "~/components/image-with-fallback";
import { getUser } from "~/lib/auth";
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
    <section className="space-y-4">
      <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:justify-start sm:gap-6 lg:gap-10">
        <div className="relative aspect-square w-28 shrink-0 overflow-hidden rounded-full border sm:w-32 lg:w-40">
          <ImageWithFallback
            src={user.image || "/images/placeholder/user.jpg"}
            fallback="/images/placeholder/user.jpg"
            alt=""
            fill
            className={cn("rounded-full p-1", !user.image && "dark:invert")}
          />

          <Skeleton className="absolute inset-1 -z-10 rounded-full" />
        </div>

        <div className="flex flex-col items-center justify-center gap-y-2 font-medium sm:items-start sm:gap-4">
          <div className="text-center sm:text-start">
            <h1 className="max-w-5xl truncate font-heading text-2xl dark:drop-shadow-md text-foreground sm:text-3xl md:text-4xl">
              {user.name ?? "User"}
            </h1>

            <small className="text-muted-foreground">
              <Mail aria-hidden className="mr-1 inline-block size-4" />
              {user.email ?? "you@example.com"}
            </small>
          </div>

          <div className="space-x-4">
            <Link
              href="/settings#account"
              className={buttonVariants({
                size: "sm",
                variant: "secondary",
                className: "h-11 w-24 lg:h-7",
              })}
            >
              <Edit aria-hidden className="mr-2 size-4" /> Edit
            </Link>

            <LogoutButton />
          </div>
        </div>
      </div>

      <Navbar />

      <div className="mb-4 min-h-120">{children}</div>
    </section>
  );
}
