import type { Lang } from "@infinitunes/types";
import { buttonVariants } from "@infinitunes/ui/components/button";
import { cookies } from "next/headers";
import Link from "next/link";

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
import { LanguagePicker } from "./language-picker";
import { MainNav } from "./main-nav";
import { ToolbarNavigation } from "./toolbar-navigation";

export async function Navbar() {
  const cookiesStore = await cookies();
  const languages = cookiesStore.get("language")?.value?.split(",") ?? [];

  const [user, megaMenu] = await Promise.all([
    getUser(),
    megaMenuOrEmpty(api.get.megaMenu({})),
  ]);

  return (
    <header className="sticky top-0 z-30 flex h-[calc(3.5rem+env(safe-area-inset-top))] w-full items-center gap-1 bg-background px-2 pt-[env(safe-area-inset-top)] md:h-14 md:gap-2 md:px-[max(var(--page-pad),calc((100%-100rem)/2))] md:pt-0">
      <AppSidebarTrigger className="hidden md:inline-flex" />

      <ToolbarNavigation />

      <MainNav megaMenu={megaMenu} className="hidden lg:block" />

      <div className="flex flex-1 items-center justify-end gap-1 md:gap-2">
        <SearchMenu topSearch={<TopSearch />} />

        <LanguagePicker initialLanguages={languages as Lang[]} />

        <SignedOut>
          <Link
            href="/login"
            className={cn(
              buttonVariants({ size: "sm" }),
              controlStyles.text,
              "hidden md:flex",
            )}
          >
            Sign In
          </Link>
        </SignedOut>

        <UserDropdown user={user} />
      </div>
    </header>
  );
}
