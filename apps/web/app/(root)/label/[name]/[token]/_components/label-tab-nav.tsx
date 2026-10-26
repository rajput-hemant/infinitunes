"use client";

import {
  LABEL_TABS,
  labelPath,
  labelTabForSegment,
  type LabelTab,
} from "@infinitunes/core/entity-route";
import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";

import { asRoute, cn } from "~/lib/utils";

const TAB_LABELS: Record<LabelTab, string> = {
  songs: "Songs",
  albums: "Albums",
};

const tabClassName = cn(
  "relative inline-flex h-10 flex-none items-center rounded-sm text-sm font-semibold whitespace-nowrap text-muted-foreground transition-colors outline-none pointer-coarse:h-11",
  "hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50",
  "after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded-full after:bg-primary after:opacity-0 after:transition-opacity",
  "aria-[current=page]:text-foreground aria-[current=page]:after:opacity-100",
);

type LabelTabNavProps = {
  /** The plain name slug, without JioSaavn's `-songs`/`-albums` suffix. */
  name: string;
  token: string;
};

/**
 * The tab row, the artist's pattern: each tab links a child route of the label
 * layout, so the header and this row stay mounted while the panel below swaps,
 * and the default `<Link>` prefetch puts each panel's skeleton in the client.
 */
export function LabelTabNav({ name, token }: LabelTabNavProps) {
  const active = labelTabForSegment(useSelectedLayoutSegment());

  return (
    <nav
      aria-label="Label sections"
      className="mb-4 flex w-full justify-start gap-6 overflow-x-auto border-b border-border [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {LABEL_TABS.map((tab) => (
        <Link
          key={tab}
          href={asRoute(labelPath(name, token, tab))}
          aria-current={tab === active ? "page" : undefined}
          className={tabClassName}
        >
          {TAB_LABELS[tab]}
        </Link>
      ))}
    </nav>
  );
}
