"use client";

import type { Queue } from "@infinitunes/types";

import { cn } from "~/lib/utils";

import { ExpandedLyrics } from "./expanded-lyrics";
import { QueueList } from "./queue-list";

export type PaneTab = "queue" | "lyrics";

const TABS: readonly { id: PaneTab; label: string }[] = [
  { id: "queue", label: "Up next" },
  { id: "lyrics", label: "Lyrics" },
];

type ExpandedPaneProps = {
  id: string;
  track: Queue;
  tab: PaneTab;
  onTabChange: (tab: PaneTab) => void;
  /** Phones show the pane only on request; md and up always show it. */
  visible: boolean;
};

/** Up next and Lyrics beside the artwork, switched by a segmented control. */
export function ExpandedPane({
  id,
  track,
  tab,
  onTabChange,
  visible,
}: ExpandedPaneProps) {
  return (
    <section
      id={id}
      aria-label="Up next and lyrics"
      className={cn(
        "min-h-0 flex-col md:flex md:h-[min(36rem,70dvh)]",
        visible ? "flex h-[50dvh]" : "hidden",
      )}
    >
      <div
        role="tablist"
        aria-label="Player view"
        className="mb-3 hidden h-(--ctl) max-w-full gap-0.5 self-start rounded-(--r-ctl) bg-fill p-0.5 md:inline-flex"
      >
        {TABS.map(({ id: tabId, label }) => (
          <button
            key={tabId}
            type="button"
            role="tab"
            id={`${id}-${tabId}-tab`}
            aria-selected={tab === tabId}
            aria-controls={`${id}-${tabId}`}
            onClick={() => onTabChange(tabId)}
            className={cn(
              "inline-flex h-[calc(var(--ctl)-0.25rem)] items-center justify-center rounded-[max(0px,calc(var(--r-ctl)-0.125rem))] px-3 text-[0.8125rem]/5 font-medium whitespace-nowrap text-muted-foreground transition-[color,background-color,box-shadow,scale] duration-fast hover:text-foreground active:scale-[0.96]",
              tab === tabId &&
                "bg-card text-foreground shadow-sm hover:text-foreground dark:bg-fill-2",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`${id}-${tab}`}
        aria-labelledby={`${id}-${tab}-tab`}
        className="min-h-0 flex-1 overflow-y-auto rounded-md p-2"
      >
        {tab === "queue" ? (
          <QueueList upNextOnly />
        ) : (
          <ExpandedLyrics track={track} />
        )}
      </div>
    </section>
  );
}
