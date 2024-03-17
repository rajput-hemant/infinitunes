import React from "react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Edit, Mail } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { H2, Small } from "@/components/ui/topography";
import { getUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { MeNavbar } from "./me-navbar";

type Props = {
  children: React.ReactNode;
};

const Layout = async ({ children }: Props) => {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <section className="mb-4 space-y-4">
      <div className="mb-10 flex flex-col justify-center gap-4 lg:flex-row lg:justify-start lg:gap-10">
        <div className="relative aspect-square w-44 overflow-hidden rounded-full border shadow-2xl transition-[width] duration-1000 md:w-56 xl:w-64">
          <Image
            src={user.image ?? "/images/placeholder/user.jpg"}
            alt={user.name ?? "User"}
            fill
            className={cn(
              "size-full rounded-full object-cover",
              !user.image && "dark:invert"
            )}
          />

          <Skeleton className="absolute inset-0 -z-10" />
        </div>

        <div className="flex flex-col items-center justify-center font-medium lg:items-start lg:gap-4">
          <H2 className="line-clamp-3 flex flex-col pb-0">
            {user.name ?? "User"}

            <Small className="block text-muted-foreground">
              <Mail className="mr-1 inline-block size-4" />
              {user.email ?? "user@example.com"}
            </Small>
          </H2>

          <Link
            href="/settings?account"
            className={buttonVariants({ variant: "secondary" })}
          >
            <Edit className="mr-2 size-4" /> Edit
          </Link>
        </div>
      </div>

      <Separator />

      <MeNavbar />

      <main className="mb-4 min-h-[30rem] space-y-4">{children}</main>
    </section>
  );
};

export default Layout;
