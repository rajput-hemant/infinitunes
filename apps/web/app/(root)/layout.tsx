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
import { getUserPlaylists } from "~/lib/db/queries";

export default async function Layout({ children }: React.PropsWithChildren) {
  const user = await getUser();

  let userPlaylists;

  if (user) {
    userPlaylists = await getUserPlaylists();
  }

  return (
    <React.Fragment>
      <AppSidebarProvider>
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
      <PlayerWrapper user={user} playlists={userPlaylists} />
    </React.Fragment>
  );
}
