"use client";

import { useSidebar } from "@infinitunes/ui/components/sidebar";
import { Cog, Compass, Home, Library, Search, User2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { isNavActive } from "~/config/nav";
import type { User } from "~/lib/auth";
import { asRoute } from "~/lib/utils";

type Props = {
  user?: User;
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
  "grid flex-1 place-content-center justify-items-center gap-1 rounded-[calc(var(--radius-2xl)-0.25rem)] text-[0.625rem]/3 font-semibold text-muted-foreground transition duration-fast active:scale-96 aria-[current=page]:bg-fill-2 aria-[current=page]:text-foreground aria-[current=page]:[&_svg]:text-primary";

type TabLinkProps = {
  tab: Tab;
  pathname: string | null;
};

function TabLink({ tab: { label, icon: Icon, href }, pathname }: TabLinkProps) {
  return (
    <Link
      href={href}
      aria-current={isNavActive(pathname, href) ? "page" : undefined}
      className={itemClassName}
    >
      <Icon aria-hidden className="size-6" />
      {label}
    </Link>
  );
}

export function MobileNav({ user }: Props) {
  const pathname = usePathname();
  const { openMobile, setOpenMobile } = useSidebar();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 flex h-16 items-stretch gap-1 rounded-2xl border bg-card p-1 shadow-lg md:hidden"
    >
      {primaryTabs.map((tab) => (
        <TabLink key={tab.label} tab={tab} pathname={pathname} />
      ))}

      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={openMobile}
        onClick={() => setOpenMobile(true)}
        className={itemClassName}
      >
        <Library aria-hidden className="size-6" />
        Library
      </button>

      <TabLink tab={user ? settingsTab : loginTab} pathname={pathname} />
    </nav>
  );
}
