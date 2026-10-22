"use client";

import type { PositionStore } from "@infinitunes/core/react/position-store";
import type { Queue } from "@infinitunes/types";
import type * as React from "react";

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
  position: PositionStore;
  onSeek: (seconds: number) => void;
};

/** Up next and Lyrics beside the artwork, switched by a segmented control. */
export function ExpandedPane({
  id,
  track,
  tab,
  onTabChange,
  visible,
  position,
  onSeek,
}: ExpandedPaneProps) {
  function handleTabKeyDown(
    event: React.KeyboardEvent<HTMLButtonElement>,
    current: PaneTab,
  ) {
    const step =
      event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (step === 0) return;
    event.preventDefault();
    const index = TABS.findIndex((t) => t.id === current);
    const next = TABS[(index + step + TABS.length) % TABS.length];
    onTabChange(next.id);
    document.getElementById(`${id}-${next.id}-tab`)?.focus();
  }

  return (
    <section
      id={id}
      aria-label="Up next and lyrics"
      className={cn(
        "min-h-0 flex-col transition-[opacity,translate,display] transition-discrete duration-base ease-drawer md:flex md:h-[min(36rem,70dvh)]",
        // Phones: the pane rises in and sinks out; `display` is discrete, so it
        // stays until the fade ends. md and up always shows it.
        visible
          ? "flex h-[50dvh] max-md:starting:translate-y-4 max-md:starting:opacity-0"
          : "hidden max-md:translate-y-4 max-md:opacity-0",
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
            aria-controls={tab === tabId ? `${id}-${tabId}` : undefined}
            tabIndex={tab === tabId ? 0 : -1}
            onClick={() => onTabChange(tabId)}
            onKeyDown={(event) => handleTabKeyDown(event, tabId)}
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
          <ExpandedLyrics track={track} position={position} onSeek={onSeek} />
        )}
      </div>
    </section>
  );
}
