import { cookies } from "next/headers";
import Link from "next/link";

import type { Lang } from "@/types";

import { siteConfig } from "@/config/site";
import { getUser } from "@/lib/auth";
import { getMegaMenu } from "@/lib/jiosaavn-api";
import { cn } from "@/lib/utils";
import { SignedOut } from "../auth-control";
import { Icons } from "../icons";
import { SearchMenu } from "../search/search-menu";
import { TopSearch } from "../search/top-search";
import { buttonVariants } from "../ui/button";
import { UserDropdown } from "../user-dropdown";
import { LanguagePicker } from "./language-picker";
import { MainNav } from "./main-nav";
import { MobileNav } from "./mobile-nav";

export async function Navbar() {
  const cookiesStore = await cookies(); // this will trigger dynamic rendering
  const languages = cookiesStore.get("language")?.value?.split(",") ?? [];

  const [user, megaMenu] = await Promise.all([getUser(), getMegaMenu()]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container flex h-14 items-center space-x-4">
        <Link href="/" className="flex items-center">
          <div className="flex items-center gap-1">
            <Icons.Logo className="size-4" />

            <span className="font-heading lowercase tracking-wide">
              {siteConfig.name}
            </span>
          </div>
        </Link>

        <MainNav megaMenu={megaMenu} className="hidden lg:block" />

        <div className="flex flex-1 items-center justify-end gap-2">
          <SearchMenu topSearch={<TopSearch />} className="hidden lg:flex" />

          <LanguagePicker initialLanguages={languages as Lang[]} />

          <SignedOut>
            <Link
              href="/login"
              className={cn(
                buttonVariants({ size: "sm" }),
                "hidden shadow-sm lg:flex"
              )}
            >
              Sign In
            </Link>
          </SignedOut>

          <UserDropdown user={user} />
        </div>
      </div>

      <MobileNav user={user} />
    </header>
  );
}
