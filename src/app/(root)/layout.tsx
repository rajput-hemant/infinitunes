import React from "react";

import Player from "@/components/player";
import Sidebar from "@/components/sidebar";
import SiteFooter from "@/components/site-footer";
import { Navbar } from "@/components/site-header/navbar";
import SecondaryNavbar from "@/components/site-header/sec-nav";
import { getUser } from "@/lib/auth";

export default async function Layout({ children }: React.PropsWithChildren) {
  const user = await getUser();

  return (
    <>
      <Navbar />

      <Sidebar
        user={user}
        className="fixed left-0 top-14 hidden h-full w-1/5 border-r lg:block xl:w-[15%]"
      />

      <main className="p-2 pb-36 sm:p-4 lg:ml-[20%] lg:pb-20 xl:ml-[15%]">
        <SecondaryNavbar />

        {children}

        <SiteFooter />
      </main>

      <Player />
    </>
  );
}
