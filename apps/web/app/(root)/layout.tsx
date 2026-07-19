import dynamic from "next/dynamic";
import React from "react";

import { Sidebar, SidebarProvider, SidebarInset } from "~/components/sidebar";
import { SiteFooter } from "~/components/site-footer";
import { Navbar } from "~/components/site-header/navbar";
import { SecondaryNavbar } from "~/components/site-header/secondary-navbar";
import { getUser } from "~/lib/auth";
import { getUserPlaylists } from "~/lib/db/queries";

const Player = dynamic(
  () => import("~/components/player").then((mod) => mod.Player),
  {
    ssr: false,
  },
);

export default async function Layout({ children }: React.PropsWithChildren) {
  const user = await getUser();

  let userPlaylists;

  if (user) {
    userPlaylists = await getUserPlaylists(user.id);
  }

  return (
    <React.Fragment>
      <SidebarProvider>
        <Sidebar user={user} userPlaylists={userPlaylists} />
        <SidebarInset>
          <Navbar />
          <main className="p-2 pb-24 sm:p-4 sm:pb-24 lg:pb-10">
            <SecondaryNavbar />
            {children}
            <SiteFooter />
          </main>
        </SidebarInset>
      </SidebarProvider>
      <Player user={user} playlists={userPlaylists} />
    </React.Fragment>
  );
}
