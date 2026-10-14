import Link from "next/link";
import { Suspense } from "react";

import { GlassSurface } from "~/components/glass/glass-surface";
import { controlStyles } from "~/lib/control-styles";
import { EMPTY_MEGA_MENU, megaMenuOrEmpty } from "~/lib/shell-data";
import { api } from "~/lib/trpc/server";
import { cn } from "~/lib/utils";

import { SearchMenu } from "../search/search-menu";
import { TopSearch } from "../search/top-search";
import { AppSidebarTrigger } from "../sidebar";
import { ViewerSignedOut, ViewerUserMenu } from "../viewer";
import { LanguagePicker } from "./language-picker";
import { MainNav } from "./main-nav";
import { Toolbar } from "./toolbar";
import { ToolbarNavigation } from "./toolbar-navigation";

const capsuleClassName = "flex items-center rounded-full p-0.5";

const mainNavClassName =
  "hidden lg:block min-[1440px]:in-data-[queue=open]:hidden!";

/** The catalog menu is cached (an hour), so it normally lands in the static shell. */
async function CatalogMenu() {
  const megaMenu = await megaMenuOrEmpty(api.get.megaMenu({}));

  return <MainNav megaMenu={megaMenu} className={mainNavClassName} />;
}

/**
 * Nothing here reads the request: the user menu and the Log in button resolve
 * the session in client islands (`ViewerProvider`) and the language picker
 * reads its cookie when it opens, so the toolbar prerenders with the layout.
 */
export function Navbar() {
  return (
    <Toolbar>
      <AppSidebarTrigger className="hidden md:inline-flex" />

      <ToolbarNavigation />

      {/* A docked queue (1440 and up) takes the column the mega menu needs; the mockup toolbar has no such links. */}
      <Suspense
        fallback={
          <MainNav megaMenu={EMPTY_MEGA_MENU} className={mainNavClassName} />
        }
      >
        <CatalogMenu />
      </Suspense>

      <div data-toolbar-title className="min-w-0 flex-1" />

      <div className="flex items-center justify-end gap-1 md:gap-2">
        <GlassSurface size="s" glassRole="toolbar" className={capsuleClassName}>
          <SearchMenu topSearch={<TopSearch />} />
        </GlassSurface>

        <GlassSurface size="s" glassRole="toolbar" className={capsuleClassName}>
          <LanguagePicker />
          <ViewerUserMenu />
        </GlassSurface>

        <ViewerSignedOut>
          <GlassSurface
            variant="tinted"
            size="s"
            glassRole="toolbar"
            render={
              <Link
                href="/login"
                className={cn(
                  controlStyles.text,
                  "hidden items-center rounded-full font-medium md:flex",
                )}
              />
            }
          >
            Log in
          </GlassSurface>
        </ViewerSignedOut>
      </div>
    </Toolbar>
  );
}
