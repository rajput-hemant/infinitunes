import type { PropsWithChildren } from "react";

import { GlassEdge } from "~/components/glass/glass-edge";
import { AppSidebarProvider, SidebarInset } from "~/components/sidebar";
import { SiteFooter } from "~/components/site-footer/footer";
import { Navbar } from "~/components/site-header/navbar";
import { MorphSource } from "~/components/view-transition/morph-source";
import {
  ViewerMobileNav,
  ViewerPlayer,
  ViewerProvider,
  ViewerSidebar,
} from "~/components/viewer";
import { getViewer } from "~/lib/viewer";

/**
 * Nothing in this body awaits request data, so the chrome prerenders. The
 * visitor is a promise handed to the islands that need it (sidebar library,
 * tab bar, user menu, player), each behind its own `<Suspense>`; the sidebar's
 * saved open/closed state is applied before first paint by
 * `lib/theme-script.ts` and picked up by `AppSidebarProvider`.
 */
export default function Layout({ children }: PropsWithChildren) {
  return (
    <ViewerProvider viewer={getViewer()}>
      <a
        href="#main-content"
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:left-2 focus-visible:top-2 focus-visible:z-90 focus-visible:rounded-ctl focus-visible:bg-card focus-visible:px-4 focus-visible:py-2 focus-visible:text-sm focus-visible:text-foreground focus-visible:shadow-md"
      >
        Skip to content
      </a>
      <MorphSource />
      <AppSidebarProvider>
        <ViewerSidebar />
        {/* Spans to the viewport edge; `page-container` / `page-gutter` keep clear of the docked queue. */}
        <div className="flex min-w-0 flex-1 flex-col">
          <Navbar />
          {/* SidebarInset renders the only main landmark. */}
          <SidebarInset
            id="main-content"
            tabIndex={-1}
            className="min-w-0 bg-transparent outline-none"
          >
            <div className="page-container pt-2 pb-[calc(10rem+env(safe-area-inset-bottom))] md:pb-36">
              {children}
              <SiteFooter />
            </div>
          </SidebarInset>
        </div>
        <GlassEdge />
        <ViewerMobileNav />
      </AppSidebarProvider>
      <ViewerPlayer />
    </ViewerProvider>
  );
}
