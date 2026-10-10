"use client";

import { Button, buttonVariants } from "@infinitunes/ui/components/button";
import { ScrollArea, ScrollBar } from "@infinitunes/ui/components/scroll-area";
import { Separator } from "@infinitunes/ui/components/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@infinitunes/ui/components/sheet";
import { ChevronDown, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

import { browseNav, isNavActive, sidebarNav } from "~/config/nav";
import { controlStyles } from "~/lib/control-styles";
import { cn } from "~/lib/utils";

import { SurpriseMeButton } from "./surprise-me-button";

export function SecondaryNavbar() {
  const pathname = usePathname();

  const [isOpen, setIsOpen] = React.useState(false);

  function toggleSheet() {
    setIsOpen((prev) => !prev);
  }

  if (!browseNav.some((i) => i.href === pathname)) return null;

  return (
    <nav aria-label="Browse" className="mb-6 border-b">
      <div className="hidden h-full items-center gap-2 lg:flex">
        <ScrollArea className="min-w-0 flex-1">
          <ul className="flex gap-6">
            {sidebarNav.map(({ title, href }) => (
              <li key={title} className="shrink-0">
                <Link
                  href={href}
                  aria-current={
                    isNavActive(pathname, href) ? "page" : undefined
                  }
                  className="relative flex h-10 items-center text-sm font-semibold text-muted-foreground transition-colors duration-fast -outline-offset-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full hover:text-foreground aria-[current=page]:text-foreground aria-[current=page]:after:bg-primary pointer-coarse:h-11"
                >
                  {title}
                </Link>
              </li>
            ))}
          </ul>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <SurpriseMeButton
          variant="secondary"
          className={cn(controlStyles.text, "ml-auto shrink-0")}
        />
      </div>

      <div className="lg:hidden">
        <Sheet open={isOpen} onOpenChange={toggleSheet}>
          <SheetTrigger
            className={cn(
              "mb-2 flex w-full items-center justify-between",
              controlStyles.text,
            )}
          >
            <span className="text-lg font-semibold">Browse</span>

            <ChevronDown aria-hidden />
          </SheetTrigger>

          <SheetContent side="bottom" className="space-y-4 rounded-t-2xl">
            <SheetHeader>
              <SheetTitle className="font-heading text-2xl font-normal dark:drop-shadow-md text-foreground md:text-3xl">
                Browse
              </SheetTitle>
            </SheetHeader>

            <Separator />

            <div>
              {sidebarNav.map(({ title, href, icon: Icon }) => {
                const isActive = isNavActive(pathname, href);

                return (
                  <Link
                    key={title}
                    href={href}
                    onClick={toggleSheet}
                    className={cn(
                      buttonVariants({ size: "sm", variant: "ghost" }),
                      controlStyles.text,
                      "my-1 flex justify-between text-muted-foreground",
                      isActive && "bg-fill-2 font-semibold text-foreground",
                    )}
                  >
                    <span>
                      <Icon aria-hidden className="mr-2 inline-block size-5" />
                      {title}
                    </span>

                    <ChevronRight aria-hidden />
                  </Link>
                );
              })}
            </div>

            <Separator />

            <div className="my-4 w-full space-y-4">
              <SurpriseMeButton
                onQueued={() => setIsOpen(false)}
                variant="secondary"
                className={cn(controlStyles.text, "w-full")}
              />
              <Separator />
              <Button
                variant="ghost"
                onClick={toggleSheet}
                className={cn(controlStyles.text, "w-full")}
              >
                Cancel
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
