"use client";

import React, { useEffect } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { useHash } from "@/hooks/use-hash";
import { buttonVariants } from "@/components/ui/button";
import { SidebarNavItem } from "./settings-sidebar-nav";

type Props = {
  href: string;
  items: SidebarNavItem["items"];
} & React.HtmlHTMLAttributes<HTMLDivElement>;

export function SettingsSidebarNavItems({ items, href, className }: Props) {
  const hash = useHash();

  useEffect(() => {}, [hash]);

  return (
    <div className={className}>
      {items.map(({ title, href: id, icon }, i) => {
        const url = `${href}#${id}`;

        return (
          <Link
            key={i}
            href={url}
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "text-muted-foreground justify-start",
              hash === id
                ? "bg-muted text-foreground"
                : "hover:bg-muted underline-offset-4 hover:underline"
            )}
          >
            {icon}

            {title}
          </Link>
        );
      })}
    </div>
  );
}
