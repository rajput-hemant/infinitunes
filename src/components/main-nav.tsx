"use client";

import { useState } from "react";
import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { X } from "lucide-react";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { Icons } from "./icons";
import { MobileNav } from "./mobile-nav";

type Props = {
  items?: {
    title: string;
    href: string;
    disabled?: boolean;
  }[];
  children?: React.ReactNode;
};

export function MainNav({ items, children }: Props) {
  const segment = useSelectedLayoutSegment();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <div className="flex gap-6 md:gap-10">
      <Link href="/" className="hidden items-center space-x-2 md:flex">
        <span className="hidden font-bold sm:inline-block">
          <div className="flex items-center gap-1">
            <Icons.Logo className="h-5 w-5" />

            <span className="text-lg lowercase">{siteConfig.name}</span>
          </div>
        </span>
      </Link>

      {items?.length && (
        <nav className="hidden gap-6 md:flex">
          {items?.map(({ title, href, disabled }, index) => (
            <Link
              key={index}
              href={disabled ? "#" : href}
              className={cn(
                "flex items-center text-lg font-medium transition-colors hover:text-foreground/80 sm:text-sm",
                href.startsWith(`/${segment}`)
                  ? "text-foreground"
                  : "text-foreground/60",
                disabled && "cursor-not-allowed opacity-80"
              )}
            >
              {title}
            </Link>
          ))}
        </nav>
      )}

      <button
        className="flex items-center space-x-2 md:hidden"
        onClick={() => setShowMobileMenu(!showMobileMenu)}
      >
        {showMobileMenu ? (
          <X className="h-5 w-5" />
        ) : (
          <Icons.Logo className="h-5 w-5" />
        )}

        <span className="font-bold">Menu</span>
      </button>

      {showMobileMenu && items && (
        <MobileNav items={items}>{children}</MobileNav>
      )}
    </div>
  );
}
