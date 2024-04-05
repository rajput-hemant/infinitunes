"use client";

import React from "react";
import Link from "next/link";
import { useSelectedLayoutSegments } from "next/navigation";
import { ListMusic, ListPlus, Play, Plus } from "lucide-react";

import type { User } from "next-auth";
import type { MyPlaylist } from "@/lib/db/schema";

import { Button, buttonVariants } from "@/components/ui/button";
import { sidebarNav } from "@/config/nav";
import { cn, currentlyInDev } from "@/lib/utils";
import { NewPlaylistForm } from "./playlist/new-playlist-form";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

type SidebarProps = {
  user?: User;
  userPlaylists?: MyPlaylist[];
};

export function Sidebar({ user, userPlaylists }: SidebarProps) {
  const [segment] = useSelectedLayoutSegments();

  return (
    <aside className="fixed left-0 top-14 hidden h-full w-1/5 space-y-2 border-r p-4 animate-in slide-in-from-left-full [animation-duration:500ms] lg:block xl:w-[15%]">
      <h3 className="pl-3 font-heading text-xl drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-2xl md:text-3xl">
        Discover
      </h3>

      <nav>
        <ul className="space-y-0.5">
          {sidebarNav.slice(0, 6).map(({ title, href, icon: Icon }) => {
            const isActive = href === "/" + (segment ?? "");

            return (
              <li key={title}>
                <NavLink title={title} href={href} isActive={isActive}>
                  <Icon className="mr-2 size-5" />
                  {title}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {!!user && (
        <>
          <h3 className="pl-3 font-heading text-lg drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-xl md:text-2xl">
            Library
          </h3>

          <nav>
            <ul className="space-y-0.5">
              {sidebarNav.slice(6).map(({ title, href, icon: Icon }) => {
                const isActive = href === "/" + (segment ?? "");

                return (
                  <li key={title}>
                    <NavLink title={title} href={href} isActive={isActive}>
                      <Icon className="mr-2 size-5 shrink-0" />
                      {title}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </nav>
        </>
      )}

      <div className="flex items-center justify-between pl-3">
        <h3 className="font-heading text-lg drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-xl md:text-2xl">
          Playlists
        </h3>

        {user && userPlaylists?.length !== 0 && (
          <Tooltip delayDuration={0}>
            <NewPlaylistForm user={user}>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" className="size-7">
                  <ListPlus className="size-4" />
                </Button>
              </TooltipTrigger>
            </NewPlaylistForm>
            <TooltipContent>Create a new playlist</TooltipContent>
          </Tooltip>
        )}
      </div>

      <div className="mx-4 space-y-2">
        {user ?
          userPlaylists?.length === 0 ?
            <NewPlaylistForm user={user}>
              <Button
                size="sm"
                title="Create Playlist"
                className="w-full truncate shadow"
              >
                <Plus className="mr-2 size-4 shrink-0" />
                Create Playlist
              </Button>
            </NewPlaylistForm>
          : null
        : <>
            <Link
              href="/login"
              className={cn(
                buttonVariants({ size: "sm" }),
                "my-2 w-full truncate font-medium shadow"
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

      <ScrollArea>
        <ul className="flex max-h-[380px] flex-col">
          {userPlaylists?.map(({ id, name }) => {
            return (
              <li key={id}>
                <NavLink
                  href={`/me/playlist/${id}`}
                  isActive={id === segment}
                  className="group"
                >
                  <ListMusic className="mr-2 size-5" />
                  {name}
                  <button
                    onClick={currentlyInDev}
                    className="invisible ml-auto rounded-full p-0.5 ring-offset-background duration-200 ease-in hover:outline-none hover:ring-2 hover:ring-ring hover:ring-offset-2 group-hover:visible"
                  >
                    <Play className="size-5" />
                  </button>
                </NavLink>
              </li>
            );
          })}
        </ul>

        <ScrollBar orientation="vertical" />
      </ScrollArea>
    </aside>
  );
}

const NavLink = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a"> & {
    isActive: boolean;
  }
>(({ href, isActive, className, children, ...props }, ref) => {
  return (
    <Link
      ref={ref}
      href={href!}
      className={cn(
        buttonVariants({ size: "sm", variant: "ghost" }),
        "flex justify-start text-muted-foreground",
        isActive && "bg-secondary font-bold text-secondary-foreground",
        className
      )}
      {...props}
    >
      {children}
    </Link>
  );
});

NavLink.displayName = "NavLink";
