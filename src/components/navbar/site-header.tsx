import Link from "next/link";

import { siteConfig } from "@/config/site";
import { getUser } from "@/lib/auth";
import { getMegaMenu } from "@/lib/jiosaavn-api";
import { cn } from "@/lib/utils";
import { Icons } from "../icons";
import LanguagePicker from "../language-picker";
import SearchMenu from "../search/search-menu";
import TopSearch from "../search/top-search";
import { buttonVariants } from "../ui/button";
import { UserDropdown } from "../user-dropdown";
import MainNav from "./main-nav";
import MobileNav from "./mobile-nav";

export const revalidate = 3600; // revalidate page every hour

export default async function SiteHeader() {
  const user = await getUser();
  const megaMenu = await getMegaMenu();

  return (
    <header className="bg-background sticky top-0 z-50 w-full border-b">
      <div className="container flex h-14 items-center space-x-4">
        <Link href="/" className="flex items-center">
          <div className="flex items-center gap-1 font-bold">
            <Icons.Logo className="size-5" />

            <span className="text-lg lowercase">{siteConfig.name}</span>
          </div>
        </Link>

        <MainNav megaMenu={megaMenu} className="hidden lg:block" />

        <div className="flex flex-1 items-center justify-end gap-2">
          <SearchMenu topSearch={<TopSearch />} className="hidden lg:flex" />

          <LanguagePicker />

          {!user && (
            <Link
              href="/login"
              className={cn(buttonVariants(), "hidden lg:flex")}
            >
              Sign In
            </Link>
          )}

          <UserDropdown user={user} />
        </div>
      </div>

      <MobileNav user={user} />
    </header>
  );
}
