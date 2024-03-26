"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";

import { sidebarNav } from "@/config/nav";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "../ui/button";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTrigger } from "../ui/sheet";

export function SecondaryNavbar() {
  const pathname = usePathname();

  const [isOpen, setIsOpen] = React.useState(false);

  function toggleSheet() {
    setIsOpen((prev) => !prev);
  }

  if (!sidebarNav.slice(0, 6).some((i) => i.href === pathname)) return null;

  return (
    <nav className="border-b">
      <div className="hidden h-full items-center gap-2 lg:flex">
        <ScrollArea>
          <ul className="flex gap-2">
            {sidebarNav.map(({ title, href }) => {
              const isActive = href === pathname;

              return (
                <li
                  key={title}
                  title={title}
                  className={cn(
                    "inline-block h-full shrink-0 border-b-2 border-transparent py-2 hover:border-primary",
                    isActive && "border-primary"
                  )}
                >
                  <Link
                    href={href}
                    className={cn(
                      buttonVariants({
                        size: "sm",
                        variant: isActive ? "secondary" : "ghost",
                      }),
                      isActive && "font-medium"
                    )}
                  >
                    {title}
                  </Link>
                </li>
              );
            })}
          </ul>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <Button
          size="sm"
          variant="secondary"
          className="ml-auto shrink-0 hover:shadow"
        >
          Surprise Me
        </Button>
      </div>

      <div className="lg:hidden">
        <Sheet open={isOpen} onOpenChange={toggleSheet}>
          <SheetTrigger className="mb-2 flex w-full justify-between">
            <h4 className="text-lg font-semibold">Browse</h4>

            <ChevronDown />
          </SheetTrigger>

          <SheetContent side="bottom" className="space-y-4 rounded-t-2xl">
            <SheetHeader>
              <h2 className="font-heading text-2xl drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent md:text-3xl">
                Browse
              </h2>
            </SheetHeader>

            <Separator />

            <div>
              {sidebarNav.map(({ title, href, icon: Icon }) => {
                const isActive = href === pathname;

                return (
                  <Link
                    key={title}
                    href={href}
                    onClick={toggleSheet}
                    className={cn(
                      buttonVariants({ size: "sm", variant: "ghost" }),
                      "my-1 flex justify-between text-muted-foreground",
                      isActive &&
                        "bg-secondary font-bold text-secondary-foreground"
                    )}
                  >
                    <span>
                      <Icon className="mr-2 inline-block size-5" />
                      {title}
                    </span>

                    <ChevronRight />
                  </Link>
                );
              })}
            </div>

            <Separator />

            <div className="my-4 w-full space-y-4">
              <Button variant="secondary" className="w-full hover:shadow">
                Surprise Me
              </Button>
              <Separator />
              <Button variant="ghost" onClick={toggleSheet} className="w-full">
                Cancel
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
