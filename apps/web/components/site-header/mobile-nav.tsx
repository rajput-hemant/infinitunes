"use client";

import { useSidebar } from "@infinitunes/ui/components/sidebar";
import { Skeleton } from "@infinitunes/ui/components/skeleton";
import { Cog, Compass, Home, Library, Search, User2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { GlassSelector } from "~/components/glass/glass-selector";
import { PathnameBoundary } from "~/components/pathname-boundary";
import { isNavActive } from "~/config/nav";
import { useTabBarMinimize } from "~/hooks/use-tab-bar-minimize";
import type { User } from "~/lib/auth";
import { asRoute, cn } from "~/lib/utils";

type Props = {
  user?: User;
  /** The session has not resolved yet: the last tab is a placeholder. */
  pending?: boolean;
};

type Tab = { label: string; icon: LucideIcon; href: Route };

const primaryTabs: Tab[] = [
  { label: "Home", icon: Home, href: "/" },
  { label: "Search", icon: Search, href: "/search" },
  { label: "Browse", icon: Compass, href: asRoute("/browse") },
];

const loginTab: Tab = { label: "Login", icon: User2, href: "/login" };
const settingsTab: Tab = { label: "Settings", icon: Cog, href: "/settings" };

const itemClassName =
  "grid flex-1 place-content-center justify-items-center gap-1 rounded-full text-[0.625rem]/3 font-semibold text-muted-foreground transition-colors duration-fast outline-hidden focus-visible:ring-2 focus-visible:ring-ring aria-[current=page]:text-primary";

type TabLinkProps = {
  tab: Tab;
  pathname: string | null;
};

function TabLink({ tab: { label, icon: Icon, href }, pathname }: TabLinkProps) {
  return (
    <Link
      data-glass-item=""
      href={href}
      aria-current={isNavActive(pathname, href) ? "page" : undefined}
      className={itemClassName}
    >
      <Icon aria-hidden className="size-6" />
      <span>{label}</span>
    </Link>
  );
}

/**
 * The phone tab bar: a glass selector whose droplet slides to the current tab.
 * It collapses to the current tab while the page scrolls down. The host is
 * marked up directly (not a GlassSurface) so the selector and the glass share
 * one element.
 */
export function MobileNav(props: Props) {
  return (
    <PathnameBoundary
      render={(pathname) => <MobileNavBar {...props} pathname={pathname} />}
    />
  );
}

function MobileNavBar({
  user,
  pending,
  pathname,
}: Props & { pathname: string | null }) {
  const { openMobile, setOpenMobile } = useSidebar();
  useTabBarMinimize();

  return (
    <GlassSelector
      render={
        <nav
          aria-label="Primary"
          data-glass="regular"
          data-glass-size="s"
          data-glass-role="tabbar"
        />
      }
      className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 flex h-16 items-stretch gap-1 p-1 md:hidden"
    >
      {primaryTabs.map((tab) => (
        <TabLink key={tab.label} tab={tab} pathname={pathname} />
      ))}

      <button
        type="button"
        data-glass-item=""
        aria-haspopup="dialog"
        aria-expanded={openMobile}
        onClick={() => setOpenMobile(true)}
        className={itemClassName}
      >
        <Library aria-hidden className="size-6" />
        <span>Library</span>
      </button>

      {pending ? (
        <div aria-hidden className={cn(itemClassName, "pointer-events-none")}>
          <Skeleton className="size-6 rounded-full" />
          <Skeleton className="h-2.5 w-9" />
        </div>
      ) : (
        <TabLink tab={user ? settingsTab : loginTab} pathname={pathname} />
      )}
    </GlassSelector>
  );
}
