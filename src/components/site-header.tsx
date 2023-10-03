import { siteConfig } from "@/config/site";
import { MainNav } from "./main-nav";
import { SearchMenu } from "./search-bar";
import { Button } from "./ui/button";

export function SiteHeader() {
  return (
    <header className="supports-backdrop-blur:bg-background/60 sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-14 items-center">
        <MainNav items={siteConfig.mainNav} />

        <div className="flex flex-1 items-center justify-end gap-2 md:gap-4">
          <SearchMenu />

          <Button size="sm">Sign In</Button>
        </div>
      </div>
    </header>
  );
}
