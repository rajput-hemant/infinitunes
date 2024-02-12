"use client";

import React from "react";
import Link from "next/link";
import { useSelectedLayoutSegments } from "next/navigation";
import { Plus } from "lucide-react";

import type { User } from "next-auth";

import { Button, buttonVariants } from "@/components/ui/button";
import { sidebarNav } from "@/config/nav";
import { cn } from "@/lib/utils";
import { H3, Muted } from "./ui/topography";

type SidebarProps = { user?: User } & React.HTMLAttributes<HTMLDivElement>;

export default function Sidebar({ user, className }: SidebarProps) {
  const [segment] = useSelectedLayoutSegments();

  const ButtonOrLink = user ? Button : Link;

  return (
    <aside
      className={cn(
        "animate-in slide-in-from-left-full space-y-2 p-4 [animation-duration:500ms]",
        className
      )}
    >
      <H3 className="pl-4">Discover</H3>

      <nav>
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
          <H3 className="pl-4">Library</H3>

          <nav>
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

      <H3 className="pl-4">Playlists</H3>

      <div className="mx-4 space-y-2">
        <ButtonOrLink
          href="/login"
          title="Create Playlist"
          className={cn(buttonVariants(), "my-2 w-full")}
        >
          <Plus className="mr-1 size-4" />

          <span className="truncate">Create Playlist</span>
        </ButtonOrLink>

        {!user && <Muted>You need to be logged in to create a playlist.</Muted>}
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
        buttonVariants({ variant: "ghost" }),
        "text-muted-foreground flex justify-start",
        isActive && "bg-secondary text-secondary-foreground font-bold"
      )}
      {...props}
    >
      {children}
    </Link>
  );
});

NavLink.displayName = "NavLink";
