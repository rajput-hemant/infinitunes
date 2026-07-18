import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Edit, Mail } from "lucide-react";

import { ImageWithFallback } from "@/components/image-with-fallback";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getUser } from "@/lib/auth";
import { LogoutButton } from "./_components/logout";
import { Navbar } from "./_components/navbar";

export default async function Layout({ children }: React.PropsWithChildren) {
  const user = await getUser();

  // TODO: protect this route with a middleware
  if (!user) {
    redirect("/login");
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col items-center justify-center gap-4 lg:flex-row lg:justify-start lg:gap-10">
        <div className="relative aspect-square w-44 shrink-0 overflow-hidden rounded-full border transition-[width] duration-1000 md:w-56 xl:w-64">
          <ImageWithFallback
            src={user.image ?? ""}
            fallback="/images/placeholder/user.jpg"
            alt={user.name ?? "~"}
            fill
            className="rounded-full p-1"
          />

          <Skeleton className="absolute inset-1 -z-10 rounded-full" />
        </div>

        <div className="flex flex-col items-center justify-center gap-y-2 font-medium lg:items-start lg:gap-6">
          <div className="text-center lg:text-start">
            <h1 className="max-w-5xl truncate font-heading text-2xl drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-3xl md:text-4xl">
              {user.name ?? "User"}
            </h1>

            <small className="text-muted-foreground">
              <Mail className="mr-1 inline-block size-4" />
              {user.email ?? "you@example.com"}
            </small>
          </div>

          <div className="space-x-4">
            <Link
              href="/settings#account"
              className={buttonVariants({
                size: "sm",
                variant: "secondary",
                className: "w-24",
              })}
            >
              <Edit className="mr-2 size-4" /> Edit
            </Link>

            <LogoutButton />
          </div>
        </div>
      </div>

      <Navbar />

      <main className="mb-4 min-h-[30rem]">{children}</main>
    </section>
  );
}
