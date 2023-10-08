import { siteConfig } from "@/config/site";

export default function SiteFooter() {
  return (
    <footer className="w-full text-center text-muted-foreground lg:ml-[-8%] lg:py-6">
      &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
    </footer>
  );
}
