import { cookies } from "next/headers";
import Link from "next/link";

import { GlassSurface } from "~/components/glass/glass-surface";
import { getUser } from "~/lib/auth";
import { controlStyles } from "~/lib/control-styles";
import { megaMenuOrEmpty } from "~/lib/shell-data";
import { api } from "~/lib/trpc/server";
import { cn } from "~/lib/utils";

import { SignedOut } from "../auth-control";
import { SearchMenu } from "../search/search-menu";
import { TopSearch } from "../search/top-search";
import { AppSidebarTrigger } from "../sidebar";
import { UserDropdown } from "../user-dropdown";
import { isLang } from "./lang-guard";
import { LanguagePicker } from "./language-picker";
import { MainNav } from "./main-nav";
import { Toolbar } from "./toolbar";
import { ToolbarNavigation } from "./toolbar-navigation";

const capsuleClassName = "flex items-center rounded-full p-0.5";

export async function Navbar() {
  const cookiesStore = await cookies();
  const languages = (
    cookiesStore.get("language")?.value?.split(",") ?? []
  ).filter(isLang);

  const [user, megaMenu] = await Promise.all([
    getUser(),
    megaMenuOrEmpty(api.get.megaMenu({})),
  ]);

  return (
    <Toolbar>
      <AppSidebarTrigger className="hidden md:inline-flex" />

      <ToolbarNavigation />

      <MainNav megaMenu={megaMenu} className="hidden lg:block" />

      <div data-toolbar-title className="min-w-0 flex-1" />

      <div className="flex items-center justify-end gap-1 md:gap-2">
        <GlassSurface size="s" glassRole="toolbar" className={capsuleClassName}>
          <SearchMenu topSearch={<TopSearch />} />
        </GlassSurface>

        <GlassSurface size="s" glassRole="toolbar" className={capsuleClassName}>
          <LanguagePicker initialLanguages={languages} />
          <UserDropdown user={user} />
        </GlassSurface>

        <SignedOut>
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
            Sign In
          </GlassSurface>
        </SignedOut>
      </div>
    </Toolbar>
  );
}
