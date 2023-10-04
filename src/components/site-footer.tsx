import { siteConfig } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="w-full py-6 md:px-8 md:py-0">
      &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
    </footer>
  );
}
