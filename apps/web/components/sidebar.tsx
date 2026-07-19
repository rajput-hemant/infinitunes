"use client";

import type { MyPlaylist } from "@infinitunes/db/schema";
import { Button } from "@infinitunes/ui/components/button";
import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@infinitunes/ui/components/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@infinitunes/ui/components/tooltip";
import { ListMusic, ListPlus, Play, Plus } from "lucide-react";
import Link from "next/link";
import { useSelectedLayoutSegments } from "next/navigation";
import React from "react";

import { sidebarNav } from "@/config/nav";
import { cn, currentlyInDev } from "@/lib/utils";
import type { User } from "@/types/user";

import { NewPlaylistForm } from "./playlist/new-playlist-form";

type SidebarProps = {
  user?: User;
  userPlaylists?: MyPlaylist[];
};

export function Sidebar({ user, userPlaylists }: SidebarProps) {
  const [segment] = useSelectedLayoutSegments();

  return (
    <SidebarPrimitive>
      <SidebarHeader>
        <h3 className="pl-3 font-heading text-xl drop-shadow-md dark:bg-linear-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-2xl md:text-3xl">
          Discover
        </h3>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {sidebarNav.slice(0, 6).map(({ title, href, icon: Icon }) => {
                const isActive = href === "/" + (segment ?? "");

                return (
                  <SidebarMenuItem key={title}>
                    <SidebarMenuButton
                      isActive={isActive}
                      render={
                        <Link href={href} className="flex items-center">
                          <Icon className="mr-2 size-5" />
                          <span>{title}</span>
                        </Link>
                      }
                    />
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!!user && (
          <>
            <SidebarGroup>
              <SidebarGroupLabel>Library</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {sidebarNav.slice(6).map(({ title, href, icon: Icon }) => {
                    const isActive = href === "/" + (segment ?? "");

                    return (
                      <SidebarMenuItem key={title}>
                        <SidebarMenuButton
                          isActive={isActive}
                          render={
                            <Link href={href} className="flex items-center">
                              <Icon className="mr-2 size-5 shrink-0" />
                              <span>{title}</span>
                            </Link>
                          }
                        />
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Playlists</SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="mx-4 mt-2 space-y-2">
                  {userPlaylists?.length === 0 ? (
                    <NewPlaylistForm user={user}>
                      <Button size="sm" className="w-full truncate shadow-sm">
                        <Plus className="mr-2 size-4 shrink-0" />
                        Create Playlist
                      </Button>
                    </NewPlaylistForm>
                  ) : null}
                </div>

                <SidebarMenu>
                  {userPlaylists?.map(({ id, name }) => {
                    return (
                      <SidebarMenuItem key={id}>
                        <SidebarMenuButton
                          isActive={id === segment}
                          render={
                            <Link
                              href={`/me/playlist/${id}`}
                              className="group flex items-center justify-between"
                            >
                              <span className="flex items-center">
                                <ListMusic className="mr-2 size-5" />
                                <span>{name}</span>
                              </span>
                              <button
                                onClick={currentlyInDev}
                                className="invisible ml-auto rounded-full p-0.5 ring-offset-background duration-200 ease-in hover:outline-hidden hover:ring-2 hover:ring-ring hover:ring-offset-2 group-hover:visible"
                              >
                                <Play className="size-5" />
                              </button>
                            </Link>
                          }
                        />
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        {!user && (
          <div className="mx-4 mt-2 space-y-2">
            <Link
              href="/login"
              className={cn(
                "flex w-full items-center rounded-md px-2 py-1 text-sm shadow-sm",
              )}
            >
              <Plus className="mr-2 size-4 shrink-0" />
              Create Playlist
            </Link>
            <p className="text-center text-xs text-muted-foreground">
              You need to be logged in to create a playlist.
            </p>
          </div>
        )}
      </SidebarContent>
    </SidebarPrimitive>
  );
}

export {
  SidebarProvider,
  SidebarTrigger,
} from "@infinitunes/ui/components/sidebar";
export { SidebarInset } from "@infinitunes/ui/components/sidebar";
