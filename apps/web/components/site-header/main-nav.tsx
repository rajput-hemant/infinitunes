"use client";

import type { MegaMenu } from "@infinitunes/types";
import { decode } from "@infinitunes/types";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@infinitunes/ui/components/navigation-menu";
import { Separator } from "@infinitunes/ui/components/separator";
import Link from "next/link";
import React from "react";

import { cn, getHref } from "~/lib/utils";

type MainNavProps = {
  megaMenu: MegaMenu;
  className?: string;
};

export function MainNav({ className, megaMenu }: MainNavProps) {
  return (
    <NavigationMenu className={className}>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Music</NavigationMenuTrigger>

          <NavigationMenuContent className="p-6 md:w-[400px] lg:w-[1000px]">
            <NavigationMenuLink
              render={
                <Link
                  href="/search"
                  className="mb-2 inline-block rounded-md text-sm font-medium text-muted-foreground hover:text-secondary-foreground"
                >
                  View all Music
                </Link>
              }
            />

            <h2 className="font-heading text-2xl dark:drop-shadow-md text-foreground sm:text-2xl md:text-4xl">
              What&apos;s Hot on Infinitunes
            </h2>

            <Separator className="my-2" />

            <div className="grid grid-cols-3 space-x-6 p-2 text-sm font-medium">
              <div className="border-r">
                <h3 className="font-heading text-2xl">New releases</h3>

                {megaMenu?.mega_menu?.new_releases?.map(
                  ({ title, perma_url }) => (
                    <ListItem
                      key={title}
                      title={title}
                      href={
                        perma_url.includes("song")
                          ? getHref(perma_url, "song")
                          : getHref(perma_url, "album")
                      }
                    >
                      {title}
                    </ListItem>
                  ),
                )}
              </div>

              <div className="border-r">
                <h3 className="font-heading text-2xl">Top Playlist</h3>

                {megaMenu?.mega_menu?.top_playlists?.map(
                  ({ title, perma_url }) => (
                    <ListItem
                      key={title}
                      title={title}
                      href={getHref(perma_url, "playlist")}
                    >
                      {title}
                    </ListItem>
                  ),
                )}
              </div>

              <div>
                <h3 className="font-heading text-2xl">Top Artists</h3>

                {megaMenu?.mega_menu?.top_artists?.map(
                  ({ title, perma_url }) => (
                    <ListItem
                      key={title}
                      title={title}
                      href={getHref(perma_url, "artist")}
                    >
                      {title}
                    </ListItem>
                  ),
                )}
              </div>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink
            href="/show"
            className={navigationMenuTriggerStyle()}
          >
            Podcasts
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

const ListItem = React.forwardRef<
  React.ElementRef<typeof Link>,
  React.ComponentProps<typeof Link>
>(({ className, children, title, ...props }, ref) => {
  return (
    <NavigationMenuLink
      render={
        <Link
          ref={ref}
          className={cn(
            "block space-y-1 rounded-md py-1.5 text-muted-foreground duration-150 hover:text-secondary-foreground",
            className,
          )}
          title={title ? decode(title) : title}
          {...props}
        >
          <span className="line-clamp-1">
            {typeof children === "string" ? decode(children) : children}
          </span>
        </Link>
      }
    />
  );
});

ListItem.displayName = "ListItem";
