"use client";

import { type ReactNode, Suspense, useEffect } from "react";

import { PlayerWrapper } from "~/components/player-wrapper";
import { Sidebar } from "~/components/sidebar";
import { MobileNav } from "~/components/site-header/mobile-nav";
import { UserDropdown } from "~/components/user-dropdown";
import { useViewer } from "~/components/viewer-context";
import { claimOptimisticOwner } from "~/lib/optimistic-owner";
import { usePlaylists } from "~/lib/optimistic-playlists";

export { useViewer, ViewerProvider } from "~/components/viewer-context";

function SidebarIsland() {
  const { user, playlists } = useViewer();
  // Playlists created, renamed or deleted in this tab show before the server confirms.
  const userPlaylists = usePlaylists(playlists);
  const userId = user?.id;
  useEffect(() => claimOptimisticOwner(userId), [userId]);

  return <Sidebar user={user} userPlaylists={userPlaylists} />;
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
