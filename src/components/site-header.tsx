import Link from "next/link";

import { siteConfig } from "@/config/site";
import { getMegaMenu } from "@/lib/jiosaavn-api";
import { Icons } from "./icons";
import LanguageSelector from "./language-selector";
import MainNav from "./main-nav";
import MobileNav from "./mobile-nav";
import SearchMenu from "./search-bar";
import ThemeToggle from "./theme-toggle";
import { Button } from "./ui/button";

export default async function SiteHeader() {
  const megaMenu = await getMegaMenu();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
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

          <LanguageSelector />

          <Button size="sm" className="hidden lg:flex">
            Sign In
          </Button>

          <ThemeToggle />
        </div>
      </div>

      <MobileNav />
    </header>
  );
}
