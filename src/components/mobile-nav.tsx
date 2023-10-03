"use client";

import * as React from "react";
import Link from "next/link";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { useLockBody } from "@/hooks/use-lock-body";
import { Icons } from "@/components/icons";

type Props = {
  items: {
    title: string;
    href: string;
    disabled?: boolean;
  }[];
  children?: React.ReactNode;
};

export function MobileNav({ items, children }: Props) {
  useLockBody();

  return (
    <div className="fixed inset-0 top-16 z-50 grid h-[calc(100vh-4rem)] grid-flow-row auto-rows-max overflow-auto p-6 pb-32 shadow-md backdrop-blur-xl animate-in slide-in-from-bottom-80 md:hidden">
      <div className="relative z-20 grid gap-6 rounded-md border bg-popover p-4 text-popover-foreground shadow-md">
        <Link href="/" className="flex items-center space-x-2">
          <Icons.Logo className="h-5 w-5" />

          <span className="font-bold">{siteConfig.name}</span>
        </Link>

        <nav className="grid grid-flow-row auto-rows-max text-sm">
          {items.map(({ href, title, disabled }, index) => (
            <Link
              key={index}
              href={disabled ? "#" : href}
              className={cn(
                "flex w-full items-center rounded-md p-2 text-sm font-medium hover:underline",
                disabled && "cursor-not-allowed opacity-60"
              )}
            >
              {title}
            </Link>
          ))}
        </nav>
        {children}
      </div>
    </div>
  );
}
