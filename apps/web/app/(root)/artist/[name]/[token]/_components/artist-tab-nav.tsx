"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";

import { ARTIST_TABS, artistPath, tabForSegment } from "~/lib/artist-route";
import { asRoute, cn } from "~/lib/utils";

import { TAB_LABELS } from "./tabs";

const tabClassName = cn(
  "relative inline-flex h-10 flex-none items-center rounded-sm text-sm font-semibold whitespace-nowrap text-muted-foreground transition-colors outline-none pointer-coarse:h-11",
  "hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50",
  "after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded-full after:bg-primary after:opacity-0 after:transition-opacity",
  "aria-[current=page]:text-foreground aria-[current=page]:after:opacity-100",
);

type ArtistTabNavProps = {
  /** The plain name slug, without a legacy tab suffix. */
  name: string;
  token: string;
  showBio: boolean;
};

/**
 * The tab row. Each tab is a link to a child route of the artist layout, so
 * the header and this row stay mounted while the panel below swaps. They use the
 * default `<Link>` prefetch, so each tab's panel skeleton is already in the
 * client when the tab is clicked.
 */
export function ArtistTabNav({ name, token, showBio }: ArtistTabNavProps) {
  const active = tabForSegment(useSelectedLayoutSegment());

  return (
    <nav
      aria-label="Artist sections"
      className="mb-4 flex w-full justify-start gap-6 overflow-x-auto border-b border-border [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {ARTIST_TABS.map((tab) => {
        if (tab === "bio" && !showBio) return null;

        return (
          <Link
            key={tab}
            href={asRoute(artistPath(name, token, tab))}
            aria-current={tab === active ? "page" : undefined}
            className={tabClassName}
          >
            {TAB_LABELS[tab]}
          </Link>
        );
      })}
    </nav>
  );
}
