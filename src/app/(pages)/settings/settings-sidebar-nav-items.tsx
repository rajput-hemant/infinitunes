"use client";

import React, { useEffect } from "react";
import Link from "next/link";

import type { SidebarNavItem } from "./settings-sidebar-nav";

import { buttonVariants } from "@/components/ui/button";
import { useHash } from "@/hooks/use-hash";
import { cn } from "@/lib/utils";

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
              "justify-start text-muted-foreground",
              hash === id ?
                "bg-muted text-foreground"
              : "underline-offset-4 hover:bg-muted hover:underline"
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
