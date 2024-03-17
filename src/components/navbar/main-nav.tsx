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
import { H2, H4, Small } from "../ui/topography";

type Props = {
  megaMenu: MegaMenu;
  className?: string;
};

function MainNav({ className, megaMenu }: Props) {
  return (
    <NavigationMenu className={className}>
      <NavigationMenuList>
        <NavigationMenuItem>
          <Link href="/">
            <NavigationMenuTrigger>Music</NavigationMenuTrigger>
          </Link>

          <NavigationMenuContent className="p-6 md:w-[400px] lg:w-[1000px]">
            <H2>What&apos;s Hot on Infinitunes</H2>

            <Separator />

            <div className="flex w-full space-x-6 p-2 text-sm font-medium">
              <div className="w-1/3 border-r">
                <H4 className="py-3 ">New releases</H4>

                {megaMenu.new_releases.map(({ name, url }) => (
                  <ListItem
                    key={name}
                    title={name}
                    href={getHref(url, "album")}
                  >
                    {name}
                  </ListItem>
                ))}
              </div>

              <div className="w-1/3 border-r">
                <H4 className="py-3">Top Playlist</H4>

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

              <div className="w-1/3">
                <H4 className="py-3">Top Artists</H4>

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

export default MainNav;

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, children, ...props }, ref) => {
  return (
    <NavigationMenuLink asChild>
      <a
        ref={ref}
        className={cn(
          "block space-y-1 rounded-md py-2 text-muted-foreground duration-150 hover:text-secondary-foreground",
          className
        )}
        {...props}
      >
        <Small className="line-clamp-1">{children}</Small>
      </a>
    </NavigationMenuLink>
  );
});

ListItem.displayName = "ListItem";
