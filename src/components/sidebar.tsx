"use client";

import React from "react";
import Link from "next/link";
import { useSelectedLayoutSegments } from "next/navigation";
import { Plus } from "lucide-react";

import type { User } from "next-auth";

import { Button, buttonVariants } from "@/components/ui/button";
import { sidebarNav } from "@/config/nav";
import { cn } from "@/lib/utils";

type SidebarProps = {
  user?: User;
};

export function Sidebar({ user }: SidebarProps) {
  const [segment] = useSelectedLayoutSegments();

  return (
    <aside className="fixed left-0 top-14 hidden h-full w-1/5 space-y-2 border-r p-4 animate-in slide-in-from-left-full [animation-duration:500ms] lg:block xl:w-[15%]">
      <h3 className="pl-3 font-heading text-xl drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-2xl md:text-3xl">
        Discover
      </h3>

      <nav className="space-y-0.5">
        {sidebarNav.slice(0, 6).map(({ title, href, icon: Icon }) => {
          const isActive = href === "/" + (segment ?? "");

          return (
            <NavLink key={title} title={title} href={href} isActive={isActive}>
              <Icon className="mr-2 size-5" />
              {title}
            </NavLink>
          );
        })}
      </nav>

      {!!user && (
        <>
          <h3 className="pl-3 font-heading text-lg drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-xl md:text-2xl">
            Library
          </h3>

          <nav className="space-y-0.5">
            {sidebarNav.slice(6).map(({ title, href, icon: Icon }) => {
              const isActive = href === "/" + (segment ?? "");

              return (
                <NavLink
                  key={title}
                  title={title}
                  href={href}
                  isActive={isActive}
                >
                  <Icon className="mr-2 size-5 shrink-0" />
                  {title}
                </NavLink>
              );
            })}
          </nav>
        </>
      )}

      <h3 className="pl-3 font-heading text-lg drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-xl md:text-2xl">
        Playlists
      </h3>

      <div className="mx-4 space-y-2">
        {user ?
          <Button title="Create Playlist" className="shadow">
            <Plus className="mr-2 size-4 shrink-0" />
            Create Playlist
          </Button>
        : <>
            <Link
              href="/login"
              className={cn(
                buttonVariants({ size: "sm" }),
                "my-2 w-full font-medium shadow"
              )}
            >
              <Plus className="mr-2 size-4 shrink-0" />
              Create Playlist
            </Link>
            <p className="text-center text-xs text-muted-foreground">
              You need to be logged in to create a playlist.
            </p>
          </>
        }
      </div>
    </aside>
  );
}

const NavLink = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a"> & {
    isActive: boolean;
  }
>(({ href, isActive, children, ...props }, ref) => {
  return (
    <Link
      ref={ref}
      href={href!}
      className={cn(
        buttonVariants({ size: "sm", variant: "ghost" }),
        "flex justify-start text-muted-foreground",
        isActive && "bg-secondary font-bold text-secondary-foreground"
      )}
      {...props}
    >
      {children}
    </Link>
  );
});

NavLink.displayName = "NavLink";
