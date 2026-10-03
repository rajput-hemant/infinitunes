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
  useSidebar,
} from "@infinitunes/ui/components/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@infinitunes/ui/components/tooltip";
import { ListMusic, Plus } from "lucide-react";
import Link from "next/link";
import { useSelectedLayoutSegments } from "next/navigation";
import React from "react";

import { browseNav, libraryNav } from "~/config/nav";
import type { User } from "~/lib/auth";
import { asRoute, cn } from "~/lib/utils";

import { NewPlaylistForm } from "./playlist/new-playlist-form";

type SidebarProps = {
  user?: User;
  userPlaylists?: MyPlaylist[];
};

export const masterSidebarWidthClassName =
  "lg:[--app-sidebar-width:20%] xl:[--app-sidebar-width:15%] 2xl:[--app-sidebar-width:12.5%]";

export const masterSidebarDesktopOffsetClassName =
  "top-14 h-[calc(100svh-3.5rem)]";

export const masterSidebarGapShellClassName =
  "w-0 shrink-0 transition-[width] duration-200 ease-linear has-[[data-slot=sidebar][data-state=collapsed]]:lg:w-(--sidebar-width-icon) has-[[data-slot=sidebar][data-state=expanded]]:lg:w-[20%] has-[[data-slot=sidebar][data-state=expanded]]:xl:w-[15%] has-[[data-slot=sidebar][data-state=expanded]]:2xl:w-[12.5%]";

// Below lg the sidebar renders as a sheet (portalled, so unaffected); this only
// hides the desktop markup server-rendered before the viewport is known.
export const masterSidebarDesktopVisibilityClassName =
  "max-lg:[&_[data-slot=sidebar]]:!hidden max-lg:[&_[data-slot=sidebar-container]]:!hidden";

type AppSidebarProviderStyle = React.CSSProperties & {
  "--sidebar-width"?: string;
};

export function AppSidebarProvider({
  className,
  style,
  ...props
}: React.ComponentProps<typeof SidebarProvider>) {
  const providerStyle: AppSidebarProviderStyle = {
    "--sidebar-width": "var(--app-sidebar-width, 16rem)",
    ...style,
  };

  return (
    <SidebarProvider
      className={cn("flex-col", masterSidebarWidthClassName, className)}
      style={providerStyle}
      {...props}
    />
  );
}

export function AppSidebarTrigger({
  className,
}: React.ComponentProps<typeof SidebarTrigger>) {
  const { open } = useSidebar();

  return (
    <SidebarTrigger
      className={className}
      aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
      aria-expanded={open}
      aria-controls="app-sidebar"
    />
  );
}

function CreatePlaylistTooltip({ children }: { children: React.ReactElement }) {
  const { isMobile, state } = useSidebar();

  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent
        side="right"
        align="center"
        hidden={state !== "collapsed" || isMobile}
      >
        Create Playlist
      </TooltipContent>
    </Tooltip>
  );
}

export function Sidebar({ user, userPlaylists }: SidebarProps) {
  const [segment] = useSelectedLayoutSegments();
  const { setOpenMobile } = useSidebar();

  return (
    <nav
      aria-label="Sidebar"
      className={cn(
        "max-lg:hidden",
        masterSidebarWidthClassName,
        masterSidebarGapShellClassName,
        masterSidebarDesktopVisibilityClassName,
      )}
    >
      <SidebarPrimitive
        id="app-sidebar"
        collapsible="icon"
        className={masterSidebarDesktopOffsetClassName}
      >
        <SidebarHeader className="group-data-[collapsible=icon]:hidden">
          <p className="pl-3 font-heading text-xl drop-shadow-md text-foreground sm:text-2xl md:text-3xl">
            Discover
          </p>
        </SidebarHeader>

        {/* Close the mobile sheet once a link is followed. */}
        <SidebarContent
          onClick={(event) => {
            if ((event.target as Element).closest("a")) setOpenMobile(false);
          }}
        >
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {browseNav.map(({ title, href, icon: Icon }) => {
                  const isActive = href === "/" + (segment ?? "");

                  return (
                    <SidebarMenuItem key={title}>
                      <SidebarMenuButton
                        isActive={isActive}
                        tooltip={title}
                        render={
                          <Link href={href} className="flex items-center">
                            <Icon className="mr-2 size-5 shrink-0 group-data-[collapsible=icon]:mr-0" />
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
                    {libraryNav.map(({ title, href, icon: Icon }) => {
                      const isActive = href === "/" + (segment ?? "");

                      return (
                        <SidebarMenuItem key={title}>
                          <SidebarMenuButton
                            isActive={isActive}
                            tooltip={title}
                            render={
                              <Link href={href} className="flex items-center">
                                <Icon className="mr-2 size-5 shrink-0 group-data-[collapsible=icon]:mr-0" />
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
                  <div className="mx-4 mt-2 space-y-2 group-data-[collapsible=icon]:mx-0">
                    {userPlaylists?.length === 0 ? (
                      <CreatePlaylistTooltip>
                        <div>
                          <NewPlaylistForm user={user}>
                            <Button
                              size="sm"
                              className="w-full truncate shadow-sm group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:px-0"
                            >
                              <Plus className="mr-2 size-4 shrink-0 group-data-[collapsible=icon]:mr-0" />
                              <span className="group-data-[collapsible=icon]:sr-only">
                                Create Playlist
                              </span>
                            </Button>
                          </NewPlaylistForm>
                        </div>
                      </CreatePlaylistTooltip>
                    ) : null}
                  </div>

                  <SidebarMenu>
                    {userPlaylists?.map(({ id, name }) => {
                      return (
                        <SidebarMenuItem key={id}>
                          <SidebarMenuButton
                            isActive={id === segment}
                            tooltip={name}
                            render={
                              <Link
                                href={asRoute(`/me/playlist/${id}`)}
                                className="flex items-center"
                              >
                                <ListMusic className="mr-2 size-5 shrink-0 group-data-[collapsible=icon]:mr-0" />
                                <span>{name}</span>
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
            <div className="mx-4 mt-2 space-y-2 group-data-[collapsible=icon]:mx-2">
              <CreatePlaylistTooltip>
                <Link
                  href="/login"
                  className="flex w-full items-center rounded-md px-2 py-1 text-sm shadow-sm outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
                >
                  <Plus className="mr-2 size-4 shrink-0 group-data-[collapsible=icon]:mr-0" />
                  <span className="group-data-[collapsible=icon]:sr-only">
                    Create Playlist
                  </span>
                </Link>
              </CreatePlaylistTooltip>
              <p className="text-center text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
                You need to be logged in to create a playlist.
              </p>
            </div>
          )}
        </SidebarContent>
      </SidebarPrimitive>
    </nav>
  );
}

export { SidebarInset } from "@infinitunes/ui/components/sidebar";
