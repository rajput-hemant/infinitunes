"use client";

import {
  formatDuration,
  getImageSrc,
  parseToken,
  removeFromQueue,
} from "@infinitunes/types";
import { Button } from "@infinitunes/ui/components/button";
import { Skeleton } from "@infinitunes/ui/components/skeleton";
import { X } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { ImageWithFallback } from "~/components/image-with-fallback";
import { getPlaceholderSrc } from "~/components/placeholder-src";
import { ArtistLinks } from "~/components/song-list/artist-links";
import { TilePlayPauseButton } from "~/components/song-list/play-pause-button";
import { useCurrentSongIndex, useQueue } from "~/hooks/use-store";
import { controlStyles } from "~/lib/control-styles";
import { cn, getHref } from "~/lib/utils";

/** Exit transition length; the row is removed from state once it finishes. */
const REMOVE_MS = 200;

/** The queue rows, shared by the docked pane and expanded player. */
export function QueueList({ upNextOnly = false }: { upNextOnly?: boolean }) {
  const [queue, setQueue] = useQueue();
  const [currentIndex, setCurrentIndex] = useCurrentSongIndex();

  const listRef = React.useRef<HTMLOListElement>(null);
  const [leaving, setLeaving] = React.useState<ReadonlySet<string>>(new Set());

  // Removals commit after the exit transition, so read the freshest state
  // through a ref: two rapid removals must not act on a stale queue.
  const latest = React.useRef({ queue, currentIndex });
  React.useEffect(() => {
    latest.current = { queue, currentIndex };
  });

  // Pending exit timers by queueItemId; also the synchronous double-click guard.
  const pending = React.useRef(new Map<string, number>());

  // The removed row takes focus with it: hand it to the row that took its
  // place (or the last one still staying), or to the list once none is left.
  // A fresh object per request so repeating an index still re-runs the effect.
  const [focusRequest, setFocusRequest] = React.useState<{
    index: number;
  } | null>(null);
  React.useEffect(() => {
    if (!focusRequest) return;
    const { index } = focusRequest;

    const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>(
      "[data-queue-remove]:not(:disabled)",
    );
    if (buttons?.length) {
      buttons[Math.min(index, buttons.length - 1)]?.focus();
    } else {
      listRef.current?.focus();
    }
  }, [focusRequest]);

  const commitRemoval = React.useCallback(
    (queueItemId: string) => {
      pending.current.delete(queueItemId);

      const { queue: current, currentIndex: playing } = latest.current;
      const index = current.findIndex(
        (item) => item.queueItemId === queueItemId,
      );
      if (index === -1) return;

      const next = removeFromQueue(current, playing, index);
      latest.current = { queue: next.queue, currentIndex: next.currentIndex };

      setQueue(next.queue);
      setCurrentIndex(next.currentIndex);
      setLeaving((ids) => {
        const rest = new Set(ids);
        rest.delete(queueItemId);
        return rest;
      });
      setFocusRequest({ index });
    },
    [setQueue, setCurrentIndex],
  );

  // The user already confirmed these removals, so closing the sheet mid-exit
  // must finish them now rather than drop them.
  React.useEffect(() => {
    const timers = pending.current;
    return () => {
      for (const [queueItemId, timer] of [...timers]) {
        window.clearTimeout(timer);
        commitRemoval(queueItemId);
      }
    };
  }, [commitRemoval]);

  function removeItem(queueItemId: string) {
    if (pending.current.has(queueItemId)) return;

    const song = latest.current.queue.find(
      (item) => item.queueItemId === queueItemId,
    );

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // No exit transition to wait for.
      pending.current.set(queueItemId, 0);
      commitRemoval(queueItemId);
    } else {
      setLeaving((ids) => new Set(ids).add(queueItemId));
      pending.current.set(
        queueItemId,
        window.setTimeout(() => commitRemoval(queueItemId), REMOVE_MS),
      );
    }

    if (song) {
      toast("Removed from queue", {
        description: `Removed "${song.name}" from the queue`,
        duration: 10000,
      });
    }
  }

  return (
    <ol
      ref={listRef}
      tabIndex={-1}
      aria-label="Queue"
      className="text-muted-foreground outline-none"
    >
      {queue.map((item, index) =>
        upNextOnly && index <= currentIndex ? null : (
          <li
            key={item.queueItemId}
            data-leaving={leaving.has(item.queueItemId) ? "" : undefined}
            inert={leaving.has(item.queueItemId)}
            aria-hidden={leaving.has(item.queueItemId) || undefined}
            className="group/row grid w-full [contain-intrinsic-size:auto_3rem] [content-visibility:auto] grid-rows-[1fr] transition-[grid-template-rows,opacity,translate] duration-base ease-spring data-leaving:-translate-x-2 data-leaving:grid-rows-[0fr] data-leaving:opacity-0"
          >
            <div className="min-h-0 overflow-hidden pb-0.5 transition-[padding] duration-base ease-spring group-data-leaving/row:pb-0">
              <div className="group relative grid min-h-12 w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-sm px-2 py-1 text-sm transition-colors duration-fast hover:bg-fill focus-within:bg-fill active:bg-fill-2">
                <div className="relative size-art shrink-0 overflow-hidden rounded-sm">
                  <ImageWithFallback
                    src={getImageSrc(item.image, "low")}
                    alt=""
                    fill
                    sizes="44px"
                    fallback={getPlaceholderSrc("song")}
                    className="z-10 object-cover"
                  />

                  <Skeleton className="absolute inset-0 rounded" />

                  <TilePlayPauseButton
                    id={item.id}
                    type={item.type}
                    token={parseToken(item.url)}
                    queueItemId={item.queueItemId}
                  />
                </div>

                <div className="flex min-w-0 flex-col">
                  <h4 className="w-full truncate text-[0.8125rem]/5 font-medium">
                    <Link
                      href={getHref(
                        item.url,
                        item.type === "song" ? "song" : "episode",
                      )}
                      title={item.name}
                      className="flex min-h-11 items-center text-foreground after:absolute after:inset-0 lg:min-h-0"
                    >
                      {item.name}
                    </Link>
                  </h4>

                  <ArtistLinks
                    artists={item.artists}
                    className="max-w-[400px]"
                    linkClassName="relative z-10 inline-flex min-h-6 items-center lg:inline lg:min-h-0"
                  />
                </div>

                <div className="flex items-center gap-1">
                  {item.duration > 0 && (
                    <span className="text-xs/4 tabular-nums">
                      {formatDuration(item.duration, "mm:ss")}
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    data-queue-remove=""
                    aria-label={`Remove ${item.name} from queue`}
                    disabled={leaving.has(item.queueItemId)}
                    tabIndex={leaving.has(item.queueItemId) ? -1 : undefined}
                    onClick={() => removeItem(item.queueItemId)}
                    className={cn(
                      controlStyles.rowIcon,
                      "relative z-10 shrink-0 p-0 text-muted-foreground opacity-0 transition-opacity duration-fast hover:bg-fill-2 hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100 group-focus-within:opacity-100 pointer-coarse:opacity-100",
                    )}
                  >
                    <X aria-hidden className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          </li>
        ),
      )}
    </ol>
  );
}
