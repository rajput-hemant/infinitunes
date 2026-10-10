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
import { usePathname } from "next/navigation";
import React from "react";

import { GlassSurface } from "~/components/glass/glass-surface";
import { browseNav, isNavActive, libraryNav } from "~/config/nav";
import type { NavItem } from "~/config/nav";
import { siteConfig } from "~/config/site";
import type { User } from "~/lib/auth";
import { controlStyles } from "~/lib/control-styles";
import { asRoute, cn } from "~/lib/utils";

import { Icons } from "./icons";
import { NewPlaylistForm } from "./playlist/new-playlist-form";

type SidebarProps = {
  user?: User;
  userPlaylists?: MyPlaylist[];
};

type SidebarProviderStyle = React.CSSProperties & {
  "--sidebar-width": string;
  "--sidebar-width-icon": string;
};

// The full sidebar follows the `--side-w` token. The collapsed sidebar and the
// tablet rail share one width so the layout does not move between them.
const providerStyle: SidebarProviderStyle = {
  "--sidebar-width": "var(--side-w)",
  "--sidebar-width-icon": "4.5rem",
};

// The bottom glass edge clears the sidebar at its current width and the docked
// queue. Set on the provider so the edge, a sibling of the sidebar, inherits it.
const edgeClassName =
  "[--g-edge-l:var(--sidebar-width)] has-[[data-slot=sidebar][data-state=collapsed]]:[--g-edge-l:var(--sidebar-width-icon)] md:max-lg:[--g-edge-l:var(--sidebar-width-icon)] min-[1440px]:in-data-[queue=open]:[--g-edge-r:var(--queue-w)]";

// A floating panel inset 0.5rem from the screen edges. The gap keeps the full
// width, so the content column never moves when the sidebar floats.
const floatingPanelClassName =
  "inset-y-2 left-2 h-auto w-[calc(var(--sidebar-width)-0.5rem)] group-data-[side=left]:border-r-0 data-[side=left]:left-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)-0.5rem)] [&>[data-slot=sidebar-inner]]:bg-transparent";

const glassPanelRadiusClassName = "rounded-[calc(var(--r-lg)+6px)]";

export function AppSidebarProvider({
  style,
  className,
  ...props
}: React.ComponentProps<typeof SidebarProvider>) {
  return (
    <SidebarProvider
      className={cn(edgeClassName, className)}
      style={{ ...providerStyle, ...style }}
      {...props}
    />
  );
}

export function AppSidebarTrigger({
  className,
}: React.ComponentProps<typeof SidebarTrigger>) {
  const { open, openMobile, isMobile } = useSidebar();
  const expanded = isMobile ? openMobile : open;

  return (
    <SidebarTrigger
      className={cn(controlStyles.headerIcon, className)}
      aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
      aria-expanded={expanded}
      aria-controls="app-sidebar"
    />
  );
}

function SidebarLogo() {
  return (
    <Link
      href="/"
      className="flex h-10 items-center gap-2 rounded-sm px-3 font-heading text-lg/6 font-bold tracking-tight lowercase group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
    >
      <span className="grid size-7 shrink-0 place-items-center rounded-sm bg-primary text-primary-foreground">
        <Icons.Logo className="size-4" />
      </span>
      <span className="group-data-[collapsible=icon]:sr-only">
        {siteConfig.name}
      </span>
    </Link>
  );
}

type SidebarNavLinkProps = Pick<NavItem, "title" | "href" | "icon"> & {
  isActive: boolean;
  // Icon-only: the label moves into a tooltip.
  collapsed: boolean;
};

function SidebarNavLink({
  title,
  href,
  icon: Icon,
  isActive,
  collapsed,
}: SidebarNavLinkProps) {
  const link = (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className="flex h-(--ctl) w-full items-center gap-3 rounded-sm px-3 text-sm font-medium text-foreground transition-colors duration-fast -outline-offset-2 hover:bg-fill active:bg-fill-2 aria-[current=page]:bg-fill-2 aria-[current=page]:[&_svg]:text-primary group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-12 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:pointer-coarse:h-11"
    >
      <Icon
        aria-hidden
        className="size-4.5 shrink-0 text-muted-foreground group-data-[collapsible=icon]:size-5"
      />
      <span className="truncate group-data-[collapsible=icon]:sr-only">
        {title}
      </span>
    </Link>
  );

  if (!collapsed) return link;

  return (
    <Tooltip>
      <TooltipTrigger render={link} />
      <TooltipContent side="right" align="center">
        {title}
      </TooltipContent>
    </Tooltip>
  );
}

type SidebarNavListProps = {
  items: readonly NavItem[];
  pathname: string | null;
  collapsed: boolean;
};

function SidebarNavList({ items, pathname, collapsed }: SidebarNavListProps) {
  return (
    <SidebarMenu className="gap-0.5">
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarNavLink
            {...item}
            isActive={isNavActive(pathname, item.href)}
            collapsed={collapsed}
          />
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

const sectionLabelClassName =
  "h-auto px-3 pb-1 text-[0.6875rem] leading-4 font-semibold tracking-[0.06em] text-muted-foreground uppercase group-data-[collapsible=icon]:hidden";

type SidebarPlaylistsProps = {
  user: User;
  userPlaylists: MyPlaylist[];
};

function SidebarPlaylists({ user, userPlaylists }: SidebarPlaylistsProps) {
  const pathname = usePathname();

  return (
    <SidebarGroup className="p-0 group-data-[collapsible=icon]:hidden">
      <div className="flex items-center justify-between">
        <SidebarGroupLabel className={sectionLabelClassName}>
          Playlists
        </SidebarGroupLabel>

        <NewPlaylistForm user={user}>
          <Button
            variant="ghost"
            aria-label="Create Playlist"
            className="size-6 rounded-sm p-0"
          >
            <Plus aria-hidden className="size-4" />
          </Button>
        </NewPlaylistForm>
      </div>

      <SidebarGroupContent>
        <SidebarMenu className="gap-0.5">
          {userPlaylists.map(({ id, name }) => {
            const href = asRoute(`/me/playlist/${id}`);

            return (
              <SidebarMenuItem key={id}>
                <SidebarNavLink
                  title={name}
                  href={href}
                  icon={ListMusic}
                  isActive={isNavActive(pathname, href)}
                  collapsed={false}
                />
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function CreatePlaylistPrompt({ user, userPlaylists }: SidebarProps) {
  return (
    <div className="space-y-2 px-3 group-data-[collapsible=icon]:hidden">
      {user && userPlaylists === undefined ? (
        <output className="block text-center text-xs text-muted-foreground">
          Couldn&apos;t load your playlists
        </output>
      ) : null}

      {user ? (
        <NewPlaylistForm user={user}>
          <Button
            variant="outline"
            className={cn(controlStyles.text, "w-full truncate")}
          >
            <Plus aria-hidden className="mr-2 size-4 shrink-0" />
            Create Playlist
          </Button>
        </NewPlaylistForm>
      ) : (
        <>
          <Link
            href="/login"
            className={cn(
              controlStyles.text,
              "flex w-full items-center justify-center border text-sm font-medium hover:bg-fill",
            )}
          >
            <Plus aria-hidden className="mr-2 size-4 shrink-0" />
            Create Playlist
          </Link>
          <p className="text-center text-xs text-muted-foreground">
            You need to be logged in to create a playlist.
          </p>
        </>
      )}
    </div>
  );
}

// The desktop sidebar is a floating glass surface. Inside the mobile sheet the
// sheet is already the glass, so the panel stays plain there.
function SidebarPanel({ children }: React.PropsWithChildren) {
  const { isMobile } = useSidebar();
  const className = "flex min-h-0 flex-1 flex-col";

  if (isMobile) {
    return (
      <nav aria-label="Sidebar" className={className}>
        {children}
      </nav>
    );
  }

  return (
    <GlassSurface
      render={<nav aria-label="Sidebar" />}
      size="xl"
      glassRole="sidebar"
      className={cn(className, glassPanelRadiusClassName)}
    >
      {children}
    </GlassSurface>
  );
}

function SidebarContents({ user, userPlaylists }: SidebarProps) {
  const pathname = usePathname();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed" && !isMobile;
  const hasPlaylists = userPlaylists !== undefined && userPlaylists.length > 0;

  return (
    <SidebarPanel>
      <SidebarHeader className="p-2 pb-0">
        <SidebarLogo />
      </SidebarHeader>

      {/* Close the mobile sheet once a link is followed. */}
      <SidebarContent
        className="gap-6 px-2 pt-6 pb-4"
        onClick={(event) => {
          if (event.target instanceof Element && event.target.closest("a")) {
            setOpenMobile(false);
          }
        }}
      >
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarNavList
              items={browseNav}
              pathname={pathname}
              collapsed={collapsed}
            />
          </SidebarGroupContent>
        </SidebarGroup>

        {user && (
          <SidebarGroup className="p-0">
            <SidebarGroupLabel className={sectionLabelClassName}>
              Library
            </SidebarGroupLabel>

            <SidebarGroupContent>
              <SidebarNavList
                items={libraryNav}
                pathname={pathname}
                collapsed={collapsed}
              />
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {user && hasPlaylists ? (
          <SidebarPlaylists user={user} userPlaylists={userPlaylists} />
        ) : (
          <CreatePlaylistPrompt user={user} userPlaylists={userPlaylists} />
        )}
      </SidebarContent>
    </SidebarPanel>
  );
}

// 768 to 1023 px. The shadcn sidebar becomes a sheet below 1024 px, so the
// rail is its own icon column; the toolbar trigger opens the full sidebar as
// that sheet.
function TabletRail({ user }: Pick<SidebarProps, "user">) {
  const pathname = usePathname();

  return (
    <GlassSurface
      render={<nav aria-label="Sidebar" data-collapsible="icon" />}
      size="xl"
      glassRole="sidebar"
      className={cn(
        "group no-scrollbar sticky top-2 ml-2 hidden h-[calc(100svh-1rem)] w-[calc(var(--sidebar-width-icon)-0.5rem)] shrink-0 flex-col gap-6 self-start overflow-y-auto p-2 md:max-lg:flex",
        glassPanelRadiusClassName,
      )}
    >
      <SidebarLogo />
      <SidebarNavList items={browseNav} pathname={pathname} collapsed />
      {user && (
        <SidebarNavList items={libraryNav} pathname={pathname} collapsed />
      )}
    </GlassSurface>
  );
}

export function Sidebar({ user, userPlaylists }: SidebarProps) {
  return (
    <>
      {/* The desktop markup is server-rendered before the viewport is known. */}
      <div className="shrink-0 max-lg:hidden">
        <SidebarPrimitive
          id="app-sidebar"
          collapsible="icon"
          className={floatingPanelClassName}
        >
          <SidebarContents user={user} userPlaylists={userPlaylists} />
        </SidebarPrimitive>
      </div>

      <TabletRail user={user} />
    </>
  );
}

export { SidebarInset } from "@infinitunes/ui/components/sidebar";
