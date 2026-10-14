import { buttonVariants } from "@infinitunes/ui/components/button";
import { Pencil } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import type { ReactNode } from "react";

import { UserAvatar } from "~/components/user-avatar";
import { getUser } from "~/lib/auth";
import { controlStyles } from "~/lib/control-styles";

import { LogoutButton } from "./_components/logout";
import { Navbar } from "./_components/navbar";
import { ProfileHeaderSkeleton } from "./_components/profile-header-skeleton";

type LibraryLayoutProps = {
  children: ReactNode;
};

/**
 * The profile header needs the session, so it streams behind a skeleton while
 * the library tabs and the page below render at once. The proxy only checks
 * that a session cookie exists; a stale one is sent to /login from here.
 */
async function ProfileHeader() {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <header className="flex flex-wrap items-center gap-5">
      <UserAvatar size="profile" user={user} />

      <div className="min-w-48 flex-1">
        <h1 className="truncate font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {user.name ?? "User"}
        </h1>
        <p className="truncate text-muted-foreground">
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
          <Pencil aria-hidden className="mr-2 size-4" /> Edit profile
        </Link>
        <LogoutButton />
      </div>
    </header>
  );
}

export default function Layout({ children }: LibraryLayoutProps) {
  return (
    <section className="flex flex-col gap-(--page-gap)">
      <Suspense fallback={<ProfileHeaderSkeleton />}>
        <ProfileHeader />
      </Suspense>

      <Navbar />

      <div className="min-h-120">{children}</div>
    </section>
  );
}
