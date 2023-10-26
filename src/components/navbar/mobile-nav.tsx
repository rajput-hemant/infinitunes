"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { Compass, Home, Search, User2 } from "lucide-react";

import { cn } from "@/lib/utils";

const mobileNavItems = [
  { label: "Home", icon: Home, href: "/" },
  { label: "Search", icon: Search, href: "/album" },
  { label: "Browse", icon: Compass, href: "/browse" },
  { label: "Login", icon: User2, href: "/login" },
];

const MobileNav = () => {
  const segment = useSelectedLayoutSegment();

  return (
    <nav className="bg-background fixed inset-x-0 bottom-0 z-50 flex h-14 items-center justify-between border-t lg:hidden">
      {mobileNavItems.map(({ label, icon: Icon, href }) => {
        const isActive = href === "/" + (segment ?? "");
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
