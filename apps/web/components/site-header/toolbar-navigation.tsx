import Link from "next/link";

import { siteConfig } from "~/config/site";

import { Icons } from "../icons";

/**
 * Leading toolbar brand for phones. From tablet up the sidebar carries the
 * brand, so the toolbar starts with the sidebar trigger instead.
 */
export function ToolbarNavigation() {
  return (
    <Link
      href="/"
      className="flex h-10 items-center gap-2 pl-2 font-heading text-lg/6 font-bold tracking-tight lowercase md:hidden"
    >
      <span className="grid size-7 shrink-0 place-items-center rounded-sm bg-primary text-primary-foreground">
        <Icons.Logo className="size-4" />
      </span>
      {siteConfig.name}
    </Link>
  );
}
