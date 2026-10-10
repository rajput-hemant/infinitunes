import { cookies } from "next/headers";
import type { PropsWithChildren } from "react";

import { GlassEdge } from "~/components/glass/glass-edge";
import { PlayerWrapper } from "~/components/player-wrapper";
import {
  AppSidebarProvider,
  Sidebar,
  SidebarInset,
} from "~/components/sidebar";
import { SiteFooter } from "~/components/site-footer/footer";
import { MobileNav } from "~/components/site-header/mobile-nav";
import { Navbar } from "~/components/site-header/navbar";
import { SecondaryNavbar } from "~/components/site-header/secondary-navbar";
import { getUser } from "~/lib/auth";
import { getUserFavorites, getUserPlaylists } from "~/lib/db/queries";
import { orFallback } from "~/lib/degrade";

// TODO: Cache Components adoption. Defer validation until session, sidebar cookies and navigation stream independently.
export const instant = false;

export default async function Layout({ children }: PropsWithChildren) {
  const [user, cookieStore] = await Promise.all([getUser(), cookies()]);
  const sidebarOpen = cookieStore.get("sidebar_state")?.value !== "false";

  const [userPlaylists, userFavorites] = await Promise.all([
    user
      ? orFallback("user playlists", getUserPlaylists(), undefined)
      : undefined,
    user ? orFallback("user favorites", getUserFavorites(), null) : undefined,
  ]);

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:left-2 focus-visible:top-2 focus-visible:z-90 focus-visible:rounded-ctl focus-visible:bg-card focus-visible:px-4 focus-visible:py-2 focus-visible:text-sm focus-visible:text-foreground focus-visible:shadow-md"
      >
        Skip to content
      </a>
      <AppSidebarProvider defaultOpen={sidebarOpen}>
        <Sidebar user={user} userPlaylists={userPlaylists} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Navbar />
          {/* SidebarInset renders the only main landmark. */}
          <SidebarInset
            id="main-content"
            tabIndex={-1}
            className="min-w-0 bg-transparent outline-none min-[1440px]:in-data-[queue=open]:mr-(--queue-w) transition-[margin] duration-base ease-spring"
          >
            <div className="mx-auto w-full max-w-400 px-page pt-2 pb-[calc(10rem+env(safe-area-inset-bottom))] md:pb-36">
              <SecondaryNavbar />
              {children}
              <SiteFooter />
            </div>
          </SidebarInset>
        </div>
        <GlassEdge />
        <MobileNav user={user} />
      </AppSidebarProvider>
      <PlayerWrapper
        user={user}
        playlists={userPlaylists}
        favorites={userFavorites}
      />
    </>
  );
}
