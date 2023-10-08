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
    <nav className="fixed inset-x-0 bottom-0 z-50 flex h-14 items-center justify-between border-t bg-background lg:hidden">
      {mobileNavItems.map(({ label, icon: Icon, href }) => {
        const isActive = href === "/" + (segment ?? "");
        return (
          <Link
            key={label}
            href={href}
            className={cn(
              "flex h-full w-1/4 flex-col items-center justify-center text-center text-muted-foreground duration-700 animate-in slide-in-from-bottom-full",
              isActive && "text-secondary-foreground"
            )}
          >
            <Icon />

            <span className="text-xs font-semibold duration-200 animate-in slide-in-from-bottom-1/2">
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};

export default MobileNav;
