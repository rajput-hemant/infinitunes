"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";

import { sidebarNav } from "@/config/nav";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "../ui/button";
import { Separator } from "../ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTrigger } from "../ui/sheet";
import { H2, H4 } from "../ui/topography";

const SecondaryNavbar = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  function toggle() {
    setIsOpen((prev) => !prev);
  }

  return (
    <nav
      className={cn(
        "hidden border-b",
        sidebarNav.slice(0, 6).some((i) => i.href === pathname) && "block"
      )}
    >
      <div className="hidden h-full items-center gap-2 lg:flex">
        {sidebarNav.map(({ title, href }) => {
          const isActive = href === pathname;

          return (
            <div
              key={title}
              className={cn(
                "hover:border-primary inline-block h-full border-b-2 border-transparent py-2",
                isActive && "border-primary"
              )}
            >
              <Link
                href={href}
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  isActive && "font-medium"
                )}
              >
                {title}
              </Link>
            </div>
          );
        })}

        <Button variant="secondary" className="ml-auto">
          Surprise Me
        </Button>
      </div>

      <div className="lg:hidden">
        <Sheet open={isOpen} onOpenChange={toggle}>
          <SheetTrigger className="flex w-full justify-between">
            <H4>Browse</H4>

            <ChevronDown />
          </SheetTrigger>

          <SheetContent side="bottom" className="rounded-t-2xl">
            <SheetHeader className="pb-4">
              <H2>Browse</H2>
            </SheetHeader>

            <Separator />

            {sidebarNav.map(({ title, href, icon: Icon }) => {
              return (
                <Link
                  key={title}
                  href={href}
                  onClick={toggle}
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    "text-muted-foreground my-1 flex justify-between",
                    href === pathname &&
                      "bg-secondary text-secondary-foreground font-bold"
                  )}
                >
                  <span>
                    <Icon className="mr-2 inline-block h-5 w-5" />
                    {title}
                  </span>

                  <ChevronRight />
                </Link>
              );
            })}

            <Separator />

            <div className="my-4 w-full space-y-4">
              <Button variant="secondary" className="w-full rounded-xl">
                Surprise Me
              </Button>

              <Separator />

              <Button
                variant="ghost"
                onClick={toggle}
                className="w-full rounded-xl"
              >
                Cancel
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
};

export default SecondaryNavbar;
