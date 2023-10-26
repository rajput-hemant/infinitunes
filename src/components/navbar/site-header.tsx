import Link from "next/link";

import { siteConfig } from "@/config/site";
import { getUser } from "@/lib/auth";
import { getMegaMenu } from "@/lib/jiosaavn-api";
import { cn } from "@/lib/utils";
import LogoutButton from "../auth/logout-button";
import { Icons } from "../icons";
import LanguagePicker from "../language-picker";
import SearchMenu from "../search-bar";
import ThemeToggle from "../theme-toggle";
import { buttonVariants } from "../ui/button";
import MainNav from "./main-nav";
import MobileNav from "./mobile-nav";

export const dynamic = "force-dynamic"; // always fetch on page load

export default async function SiteHeader() {
  const user = await getUser();
  const megaMenu = await getMegaMenu();

  return (
    <header className="bg-background sticky top-0 z-50 w-full border-b">
      <div className="container flex h-14 items-center space-x-4">
        <Link href="/" className="flex items-center">
          <div className="flex items-center gap-1 font-bold">
            <Icons.Logo className="h-5 w-5" />

            <span className="text-lg lowercase">{siteConfig.name}</span>
          </div>
        </Link>

        <MainNav megaMenu={megaMenu} className="hidden lg:block" />

        <div className="flex flex-1 items-center justify-end gap-2">
          <SearchMenu className="hidden lg:block" />

          <LanguagePicker />

          {user ? (
            <LogoutButton />
          ) : (
            <Link
              href="/login"
              className={cn(buttonVariants(), "hidden lg:flex")}
            >
              Sign In
            </Link>
          )}

          <ThemeToggle />
        </div>
      </div>

      <MobileNav />
    </header>
  );
}
