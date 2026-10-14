"use client";

import { createContext, Suspense, use } from "react";
import type { ReactNode } from "react";

import { PlayerWrapper } from "~/components/player-wrapper";
import { Sidebar } from "~/components/sidebar";
import { MobileNav } from "~/components/site-header/mobile-nav";
import { UserDropdown } from "~/components/user-dropdown";
import type { Viewer } from "~/lib/viewer-types";

const ViewerContext = createContext<Promise<Viewer> | null>(null);

type ViewerProviderProps = {
  /** Started, not awaited, by the layout; resolved behind `<Suspense>` below. */
  viewer: Promise<Viewer>;
  children: ReactNode;
};

/**
 * Carries the visitor (session, playlists, favorites) to the layout's client
 * islands as a promise. The layout never awaits it, so the chrome around the
 * islands prerenders and each island streams in behind its own fallback.
 */
export function ViewerProvider({ viewer, children }: ViewerProviderProps) {
  return <ViewerContext value={viewer}>{children}</ViewerContext>;
}

/** Suspends until the viewer resolves; call it under a `<Suspense>` boundary. */
export function useViewer(): Viewer {
  const viewer = use(ViewerContext);
  if (!viewer)
    throw new Error("useViewer must be used within a ViewerProvider");

  return use(viewer);
}

function SidebarIsland() {
  const { user, playlists } = useViewer();

  return <Sidebar user={user} userPlaylists={playlists} />;
}

/** The sidebar frame renders at once; the library part waits for the viewer. */
export function ViewerSidebar() {
  return (
    <Suspense fallback={<Sidebar pending />}>
      <SidebarIsland />
    </Suspense>
  );
}

function MobileNavIsland() {
  const { user } = useViewer();

  return <MobileNav user={user} />;
}

export function ViewerMobileNav() {
  return (
    <Suspense fallback={<MobileNav pending />}>
      <MobileNavIsland />
    </Suspense>
  );
}

function UserMenuIsland() {
  const { user } = useViewer();

  return <UserDropdown user={user} />;
}

/** The guest menu until the session resolves, so the trigger never jumps. */
export function ViewerUserMenu() {
  return (
    <Suspense fallback={<UserDropdown />}>
      <UserMenuIsland />
    </Suspense>
  );
}

function SignedOutIsland({ children }: { children: ReactNode }) {
  const { user } = useViewer();

  return user ? null : <>{children}</>;
}

type ViewerSignedOutProps = {
  children: ReactNode;
  /** What holds the place until the session is known (default: nothing). */
  fallback?: ReactNode;
};

/** Renders its children for a signed-out visitor, and `fallback` while unknown. */
export function ViewerSignedOut({
  children,
  fallback = null,
}: ViewerSignedOutProps) {
  return (
    <Suspense fallback={fallback}>
      <SignedOutIsland>{children}</SignedOutIsland>
    </Suspense>
  );
}

function PlayerIsland() {
  const { user, playlists, favorites } = useViewer();

  return (
    <PlayerWrapper user={user} playlists={playlists} favorites={favorites} />
  );
}

export function ViewerPlayer() {
  return (
    <Suspense fallback={null}>
      <PlayerIsland />
    </Suspense>
  );
}
