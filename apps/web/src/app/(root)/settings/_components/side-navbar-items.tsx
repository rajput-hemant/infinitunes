"use client";

import { buttonVariants } from "@infinitunes/ui/button";
import Link from "next/link";
import React from "react";

import { useHash } from "@/hooks/use-hash";
import { cn } from "@/lib/utils";

import type { SidebarNavItem } from "./side-navbar";

type SideNavItemsProps = React.ComponentProps<"div"> & {
  href: string;
  items: SidebarNavItem["items"];
};

export function SideNavItems({ items, href, ...props }: SideNavItemsProps) {
  const windowHash = useHash();

  return (
    <div {...props}>
      {items.map(({ title, hash, icon }, i) => (
        <Link
          key={i}
          href={`${href}#${hash}`}
          className={cn(
            buttonVariants({ size: "sm", variant: "ghost" }),
            "justify-start text-muted-foreground",
            windowHash === hash
              ? "bg-muted text-foreground"
              : "underline-offset-4 hover:bg-muted hover:underline",
          )}
        >
          {icon}

          {title}
        </Link>
      ))}
    </div>
  );
}
