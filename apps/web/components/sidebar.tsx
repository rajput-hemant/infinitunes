"use client";

import type { PlaylistView } from "@infinitunes/core/react/optimistic-playlists";
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
import { Skeleton } from "@infinitunes/ui/components/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@infinitunes/ui/components/tooltip";
import { ListMusic, Plus } from "lucide-react";
import Link from "next/link";
import React from "react";

import { GlassSurface } from "~/components/glass/glass-surface";
import { PathnameBoundary } from "~/components/pathname-boundary";
import { browseNav, isNavActive, libraryNav } from "~/config/nav";
import type { NavItem } from "~/config/nav";
import { siteConfig } from "~/config/site";
import { useIsHydrated } from "~/hooks/use-is-hydrated";
import type { User } from "~/lib/auth";
import { controlStyles } from "~/lib/control-styles";
import { asRoute, cn, isMacOs } from "~/lib/utils";

import { Icons } from "./icons";
import { NewPlaylistForm } from "./playlist/new-playlist-form";

type SidebarProps = {
  user?: User;
  userPlaylists?: PlaylistView[];
  /** The session has not resolved yet: the library part shows placeholders. */
  pending?: boolean;
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

// Rail and full sidebar share one item layout: the icon sits at the same x in
// both, so a collapse only narrows the item and fades the label, which is
// flexed to whatever width is left (zero in the rail) and stays readable to
// assistive tech. The panel itself eases in `styles/motion.css`.
const railMotion =
  "transition-[width,height,padding,gap,background-color,color] duration-panel ease-panel";
const railLabel =
  "min-w-0 flex-1 truncate opacity-100 transition-opacity duration-panel ease-panel group-data-[collapsible=icon]:opacity-0";
// Groups the rail does not show fade out, then leave the layout at the end of
// the transition (`.sidebar-rail-hide` in `styles/globals.css`).
const railHide = "sidebar-rail-hide group-data-[collapsible=icon]:hidden";

const glassPanelRadiusClassName = "rounded-[calc(var(--r-lg)+6px)]";

const subscribeNever = () => () => {};

export function AppSidebarProvider({
  defaultOpen = true,
  style,
  className,
  ...props
}: Omit<
  React.ComponentProps<typeof SidebarProvider>,
  "open" | "onOpenChange"
>) {
  // The layout never reads the cookie, so the server renders the sidebar open.
  // `lib/theme-script.ts` flags a saved collapsed sidebar on <html> before first
  // paint; the browser snapshot picks it up in the commit that hydrates, so
  // hydration itself still matches the server markup.
  const saved = React.useSyncExternalStore(
    subscribeNever,
    () =>
      document.documentElement.dataset.sidebar === "collapsed"
        ? false
        : defaultOpen,
    () => defaultOpen,
  );
  const [chosen, setChosen] = React.useState<boolean>();

  // Ends the CSS stand-in for the flag (`styles/globals.css`) in the same task
  // that applies the saved state, so the gutter never changes width.
  React.useLayoutEffect(() => {
    document.documentElement.dataset.sidebarReady = "";
  }, []);

  return (
    <SidebarProvider
      open={chosen ?? saved}
      onOpenChange={(open) => {
        // Keep the flag in step with the choice: a provider that remounts (after
        // a trip through the auth layout) reads it again as its saved state.
        if (open) delete document.documentElement.dataset.sidebar;
        else document.documentElement.dataset.sidebar = "collapsed";
        setChosen(open);
      }}
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
  const isMac = useIsHydrated() && isMacOs();
  const expanded = isMobile ? openMobile : open;
  const label = expanded ? "Collapse sidebar" : "Expand sidebar";

  // A round toolbar capsule like the history pill. The ghost button's own
  // `aria-expanded:bg-muted` would keep it a solid dark disc while open, so the
  // fill is cleared and only hover and press paint it.
  return (
    <GlassSurface
      size="s"
      glassRole="toolbar"
      className={cn("flex items-center rounded-full p-0.5", className)}
    >
      <Tooltip>
        <TooltipTrigger
          data-slot="sidebar-trigger"
          render={
            <SidebarTrigger
              className={cn(
                controlStyles.headerIcon,
                "aria-expanded:bg-transparent aria-expanded:hover:bg-muted",
              )}
              aria-label={label}
              aria-expanded={expanded}
              aria-controls="app-sidebar"
            />
          }
        />
        <TooltipContent side="bottom">
          {label}
          <kbd data-slot="kbd" className="font-sans opacity-70">
            {isMac ? "\u2318 B" : "Ctrl B"}
          </kbd>
        </TooltipContent>
      </Tooltip>
    </GlassSurface>
  );
}

function SidebarLogo({ collapsed }: { collapsed: boolean }) {
  const link = (
    <Link
      href="/"
      className={cn(
        "flex h-10 items-center gap-2 rounded-sm px-3 font-heading text-lg/6 font-bold tracking-tight lowercase group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-2.5",
        railMotion,
      )}
    >
      <span className="grid size-7 shrink-0 place-items-center rounded-sm bg-primary text-primary-foreground">
        <Icons.Logo className="size-4" />
      </span>
      <span className={railLabel}>{siteConfig.name}</span>
    </Link>
  );

  return (
    <Tooltip disabled={!collapsed}>
      <TooltipTrigger render={link} />
      <TooltipContent side="right" align="center">
        {siteConfig.name}
      </TooltipContent>
    </Tooltip>
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
      className={cn(
        "flex h-(--ctl) w-full items-center gap-3 rounded-sm px-3 text-sm font-medium text-foreground -outline-offset-2 hover:bg-fill active:bg-fill-2 aria-[current=page]:bg-fill-2 aria-[current=page]:[&_svg]:text-primary group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-12 group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-3.5 group-data-[collapsible=icon]:pointer-coarse:h-11",
        railMotion,
      )}
    >
      <Icon
        aria-hidden
        className="size-4.5 shrink-0 text-muted-foreground transition-[width,height] duration-panel ease-panel group-data-[collapsible=icon]:size-5"
      />
      <span className={railLabel}>{title}</span>
    </Link>
  );

  // Always wrapped, so the link keeps its element through a collapse and its
  // width, padding and label can transition instead of remounting.
  return (
    <Tooltip disabled={!collapsed}>
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

const sectionLabelClassName = `h-auto px-3 pb-1 text-[0.6875rem] leading-4 font-semibold tracking-[0.06em] text-muted-foreground uppercase ${railHide}`;

type SidebarPlaylistsProps = {
  userPlaylists: PlaylistView[];
  pathname: string | null;
};

function SidebarPlaylists({ userPlaylists, pathname }: SidebarPlaylistsProps) {
  return (
    <SidebarGroup className={cn("p-0", railHide)}>
      <div className="flex items-center justify-between">
        <SidebarGroupLabel className={sectionLabelClassName}>
          Playlists
        </SidebarGroupLabel>

        <NewPlaylistForm>
          <Button
            variant="ghost"
            aria-label="Create Playlist"
            className={cn(
              controlStyles.headerIcon,
              "p-0 focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            <Plus aria-hidden className="size-4" />
          </Button>
        </NewPlaylistForm>
      </div>

      <SidebarGroupContent>
        <SidebarMenu className="gap-0.5">
          {userPlaylists.map(({ id, name, pending }) => {
            // Created a moment ago: no id to link to until the write returns.
            if (pending) {
              return (
                <SidebarMenuItem key={id}>
                  <div
                    aria-busy
                    title={`${name} (creating)`}
                    className="flex h-(--ctl) w-full cursor-progress items-center gap-3 px-3 text-sm font-medium text-foreground opacity-60"
                  >
                    <ListMusic
                      aria-hidden
                      className="size-4.5 shrink-0 text-muted-foreground"
                    />
                    <span className={railLabel}>{name}</span>
                  </div>
                </SidebarMenuItem>
              );
            }
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
    <div className={cn("space-y-2 px-3", railHide)}>
      {user && userPlaylists === undefined ? (
        <output className="block text-center text-xs text-muted-foreground">
          Couldn&apos;t load your playlists
        </output>
      ) : null}

      {user ? (
        <NewPlaylistForm>
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

/** Stands in for the Library group and the playlist list until the session resolves. */
function SidebarLibrarySkeleton({ collapsed }: { collapsed: boolean }) {
  const rows = libraryNav.length;

  return (
    <div aria-hidden className="flex flex-col gap-6">
      <div className="flex flex-col gap-0.5">
        {!collapsed && <Skeleton className="mx-3 mb-2 h-3 w-14" />}
        {Array.from({ length: rows }, (_, i) => (
          <div
            key={i}
            className="flex h-(--ctl) items-center gap-3 px-3 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-12 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
          >
            <Skeleton className="size-4.5 shrink-0 rounded-sm" />
            <Skeleton className="h-3 w-24 group-data-[collapsible=icon]:hidden" />
          </div>
        ))}
      </div>
    </div>
  );
}

type PathnameProps = { pathname: string | null };

function SidebarContents({
  user,
  userPlaylists,
  pending,
  pathname,
}: SidebarProps & PathnameProps) {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed" && !isMobile;
  const hasPlaylists = userPlaylists !== undefined && userPlaylists.length > 0;

  return (
    <SidebarPanel>
      <SidebarHeader className="p-2 pb-0">
        <SidebarLogo collapsed={collapsed} />
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

        {pending && <SidebarLibrarySkeleton collapsed={collapsed} />}

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

        {pending ? null : user && hasPlaylists ? (
          <SidebarPlaylists userPlaylists={userPlaylists} pathname={pathname} />
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
function TabletRail({
  user,
  pathname,
}: Pick<SidebarProps, "user"> & PathnameProps) {
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
      <SidebarLogo collapsed />
      <SidebarNavList items={browseNav} pathname={pathname} collapsed />
      {user && (
        <SidebarNavList items={libraryNav} pathname={pathname} collapsed />
      )}
    </GlassSurface>
  );
}

export function Sidebar({ user, userPlaylists, pending }: SidebarProps) {
  return (
    <PathnameBoundary
      render={(pathname) => (
        <>
          {/* The desktop markup is server-rendered before the viewport is known. */}
          <div className="shrink-0 max-lg:hidden">
            <SidebarPrimitive
              id="app-sidebar"
              collapsible="icon"
              className={floatingPanelClassName}
            >
              <SidebarContents
                user={user}
                userPlaylists={userPlaylists}
                pending={pending}
                pathname={pathname}
              />
            </SidebarPrimitive>
          </div>

          <TabletRail user={user} pathname={pathname} />
        </>
      )}
    />
  );
}

export { SidebarInset } from "@infinitunes/ui/components/sidebar";
