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

  let userPlaylists;
  let userFavorites;

  if (user) {
    [userPlaylists, userFavorites] = await Promise.all([
      getUserPlaylists(),
      getUserFavorites(),
    ]);
  }

  return (
    <React.Fragment>
      <AppSidebarProvider defaultOpen={sidebarOpen}>
        <Navbar />
        <div className="flex min-h-0 w-full flex-1">
          <Sidebar user={user} userPlaylists={userPlaylists} />
          <SidebarInset className="min-w-0">
            <main className="p-2 pb-24 sm:p-4 sm:pb-24 lg:pb-10">
              <SecondaryNavbar />
              {children}
              <SiteFooter />
            </main>
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
