"use client";

import React from "react";
import Link from "next/link";

import type { MegaMenu } from "@/types";

import { cn, getHref } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "../ui/navigation-menu";
import { Separator } from "../ui/separator";

type MainNavProps = {
  megaMenu: MegaMenu;
  className?: string;
};

export function MainNav({ className, megaMenu }: MainNavProps) {
  return (
    <NavigationMenu className={className}>
      <NavigationMenuList>
        <NavigationMenuItem>
          <Link href="/">
            <NavigationMenuTrigger>Music</NavigationMenuTrigger>
          </Link>

          <NavigationMenuContent className="p-6 md:w-[400px] lg:w-[1000px]">
            <h2 className="font-heading text-2xl drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-2xl md:text-4xl">
              What&apos;s Hot on Infinitunes
            </h2>

            <Separator className="my-2" />

            <div className="grid grid-cols-3 space-x-6 p-2 text-sm font-medium">
              <div className="border-r">
                <h4 className="font-heading text-2xl">New releases</h4>

                {megaMenu.new_releases.map(({ name, url }) => (
                  <ListItem
                    key={name}
                    title={name}
                    href={
                      url.includes("song") ?
                        getHref(url, "song")
                      : getHref(url, "album")
                    }
                  >
                    {name}
                  </ListItem>
                ))}
              </div>

              <div className="border-r">
                <h4 className="font-heading text-2xl">Top Playlist</h4>

                {megaMenu.top_playlists.map(({ name, url }) => (
                  <ListItem
                    key={name}
                    title={name}
                    href={getHref(url, "playlist")}
                  >
                    {name}
                  </ListItem>
                ))}
              </div>

              <div>
                <h4 className="font-heading text-2xl">Top Artists</h4>

                {megaMenu.top_artists.map(({ name, url }) => (
                  <ListItem
                    key={name}
                    title={name}
                    href={getHref(url, "artist")}
                  >
                    {name}
                  </ListItem>
                ))}
              </div>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <Link href="/show" legacyBehavior passHref>
            <NavigationMenuLink className={navigationMenuTriggerStyle()}>
              Podcasts
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

const ListItem = React.forwardRef<
  React.ElementRef<typeof Link>,
  React.ComponentPropsWithoutRef<typeof Link>
>(({ className, children, ...props }, ref) => {
  return (
    <NavigationMenuLink asChild>
      <Link
        ref={ref}
        className={cn(
          "block space-y-1 rounded-md py-1.5 text-muted-foreground duration-150 hover:text-secondary-foreground",
          className
        )}
        {...props}
      >
        <span className="line-clamp-1">{children}</span>
      </Link>
    </NavigationMenuLink>
  );
});

ListItem.displayName = "ListItem";
