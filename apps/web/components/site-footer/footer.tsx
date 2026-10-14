import Link from "next/link";

import { siteConfig } from "~/config/site";

import { ThemeToggleGroup } from "./theme-toggle-group";

const year = new Date().getFullYear();

const linkClassName =
  "transition-colors duration-fast hover:text-foreground pointer-coarse:flex pointer-coarse:min-h-11 pointer-coarse:items-center";

export function SiteFooter() {
  return (
    <footer className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t pt-6 text-xs/4 text-muted-foreground">
      <span>
        © {year} {siteConfig.name}
      </span>

      <nav aria-label="Footer" className="flex flex-wrap gap-x-4">
        <Link href="/privacy" className={linkClassName}>
          Privacy
        </Link>
        <Link href="/terms" className={linkClassName}>
          Terms
        </Link>
        <a
          href={siteConfig.links.github}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClassName}
        >
          GitHub
        </a>
      </nav>

      <ThemeToggleGroup />
    </footer>
  );
}
