import React from "react";

import Player from "@/components/player";
import { Sidebar } from "@/components/sidebar";
import { SiteFooter } from "@/components/site-footer";
import { Navbar } from "@/components/site-header/navbar";
import { SecondaryNavbar } from "@/components/site-header/secondary-navbar";
import { getUser } from "@/lib/auth";
import RouteGuard from "./route-guard";

export default async function Layout({ children }: React.PropsWithChildren) {
  const user = await getUser();

  return (
    <>
      <RouteGuard />

      <Navbar />

      <Sidebar user={user} />

      <main className="p-2 pb-36 sm:p-4 lg:ml-[20%] lg:pb-20 xl:ml-[15%]">
        <SecondaryNavbar />

        {children}

        <SiteFooter />
      </main>

      <Player />
    </>
  );
}
