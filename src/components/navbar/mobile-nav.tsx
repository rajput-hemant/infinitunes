"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cog, Compass, Home, Search, User2 } from "lucide-react";

import type { User } from "next-auth";

import { cn } from "@/lib/utils";

type Props = {
  user?: User;
};

const mobileNavItems = [
  { label: "Home", icon: Home, href: "/" },
  { label: "Search", icon: Search, href: "/search" },
  { label: "Browse", icon: Compass, href: "/browse" },
  { label: "Login", icon: User2, href: "/login" },
  { label: "Settings", icon: Cog, href: "/settings" },
];

const MobileNav = ({ user }: Props) => {
  const pathname = usePathname();

  const filteredNavItems = mobileNavItems.filter(({ label }) =>
    user ? label !== "Login" : label !== "Settings"
  );

  return (
    <nav className="bg-background fixed inset-x-0 bottom-0 z-50 flex h-14 items-center justify-between border-t lg:hidden">
      {filteredNavItems.slice().map(({ label, icon: Icon, href }) => {
        const isActive = href === pathname;
        return (
          <Link
            key={label}
            href={href}
            className={cn(
              "text-muted-foreground animate-in slide-in-from-bottom-full flex h-full w-1/4 flex-col items-center justify-center text-center duration-700",
              isActive && "text-secondary-foreground"
            )}
          >
            <Icon />

            <span className="animate-in slide-in-from-bottom-1/2 text-xs font-semibold duration-200">
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};

export default MobileNav;
