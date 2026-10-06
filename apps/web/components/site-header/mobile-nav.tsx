"use client";

import { useSidebar } from "@infinitunes/ui/components/sidebar";
import { Cog, Compass, Home, Library, Search, User2 } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

import type { User } from "~/lib/auth";
import { asRoute, cn } from "~/lib/utils";

type Props = {
  user?: User;
};

const mobileNavItems = [
  { label: "Home", icon: Home, href: "/" },
  { label: "Search", icon: Search, href: "/search" },
  { label: "Browse", icon: Compass, href: asRoute("/browse") },
  { label: "Login", icon: User2, href: "/login" },
  { label: "Settings", icon: Cog, href: "/settings" },
] satisfies { label: string; icon: typeof Home; href: Route }[];

const itemClassName =
  "flex h-14 min-w-0 flex-1 flex-col items-center justify-center text-center text-muted-foreground duration-300 animate-in fade-in";

export function MobileNav({ user }: Props) {
  const pathname = usePathname();
  const { openMobile, setOpenMobile } = useSidebar();

  const filteredNavItems = mobileNavItems.filter(({ label }) =>
    user ? label !== "Login" : label !== "Settings",
  );

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-50 flex h-[calc(3.5rem+env(safe-area-inset-bottom))] items-start justify-between border-t bg-background pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {filteredNavItems.map(({ label, icon: Icon, href }) => {
        const isActive = href === pathname;

        return (
          <Link
            key={label}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              itemClassName,
              isActive && "text-secondary-foreground",
            )}
          >
            <Icon aria-hidden />

            <span className="text-xs font-semibold">{label}</span>
          </Link>
        );
      })}

      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={openMobile}
        onClick={() => setOpenMobile(true)}
        className={itemClassName}
      >
        <Library aria-hidden />

        <span className="text-xs font-semibold">Library</span>
      </button>
    </nav>
  );
}
