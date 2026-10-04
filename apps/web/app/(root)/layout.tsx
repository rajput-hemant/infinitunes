import { cookies } from "next/headers";
import React from "react";

import { PlayerWrapper } from "~/components/player-wrapper";
import {
  AppSidebarProvider,
  Sidebar,
  SidebarInset,
} from "~/components/sidebar";
import { SiteFooter } from "~/components/site-footer/footer";
import { Navbar } from "~/components/site-header/navbar";
import { SecondaryNavbar } from "~/components/site-header/secondary-navbar";
import { getUser } from "~/lib/auth";
import { getUserFavorites, getUserPlaylists } from "~/lib/db/queries";

export default async function Layout({ children }: React.PropsWithChildren) {
  const [user, cookieStore] = await Promise.all([getUser(), cookies()]);
  const sidebarOpen = cookieStore.get("sidebar_state")?.value !== "false";

  const [userPlaylists, userFavorites] = await Promise.all([
    user ? getUserPlaylists() : undefined,
    user ? getUserFavorites() : undefined,
  ]);

  return (
    <React.Fragment>
      <a
        href="#main-content"
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:left-2 focus-visible:top-2 focus-visible:z-[60] focus-visible:rounded-md focus-visible:bg-background focus-visible:px-4 focus-visible:py-2 focus-visible:text-sm focus-visible:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        Skip to content
      </a>
      <AppSidebarProvider defaultOpen={sidebarOpen}>
        <Navbar />
        <div className="flex min-h-0 w-full flex-1">
          <Sidebar user={user} userPlaylists={userPlaylists} />
          {/* SidebarInset renders the only main landmark. */}
          <SidebarInset
            id="main-content"
            tabIndex={-1}
            className="min-w-0 outline-none"
          >
            <div className="mx-auto w-full max-w-(--breakpoint-2xl) px-2 pt-2 pb-[calc(9rem+env(safe-area-inset-bottom))] sm:px-4 sm:pt-4 lg:pb-24">
              <SecondaryNavbar />
              {children}
              <SiteFooter />
            </div>
          </SidebarInset>
        </div>
      </AppSidebarProvider>
      <PlayerWrapper
        user={user}
        playlists={userPlaylists}
        favorites={userFavorites}
      />
    </React.Fragment>
  );
}
