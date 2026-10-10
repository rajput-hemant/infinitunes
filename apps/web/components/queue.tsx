"use client";

import {
  formatDuration,
  getImageSrc,
  parseToken,
  removeFromQueue,
} from "@infinitunes/types";
import { Button } from "@infinitunes/ui/components/button";
import { Skeleton } from "@infinitunes/ui/components/skeleton";
import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { X } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { ImageWithFallback } from "~/components/image-with-fallback";
import { getPlaceholderSrc } from "~/components/placeholder-src";
import { useKeydown } from "~/hooks/use-keydown";
import { useCurrentSongIndex, useQueue } from "~/hooks/use-store";
import { controlStyles } from "~/lib/control-styles";
import { cn, getHref } from "~/lib/utils";

import { ArtistLinks } from "./song-list/artist-links";
import { TilePlayPauseButton } from "./song-list/play-pause-button";

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

const WIDE_QUERY = "(min-width: 1440px)";

function subscribeWide(onChange: () => void) {
  const query = window.matchMedia(WIDE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

const isWide = () => window.matchMedia(WIDE_QUERY).matches;

// Only the docked pane is a standing preference. Read on init (the player is
// client-only) so the first paint already has the saved side.
const dockedOpenAtom = atomWithStorage("queue_open", true, undefined, {
  getOnInit: true,
});

/**
 * Open state of the queue pane. At 1440px and up it docks beside the content
 * and the choice persists; below that it floats over the page and starts
 * closed on every visit.
 */
export function useQueuePane() {
  const docked = React.useSyncExternalStore(subscribeWide, isWide, () => false);
  const [dockedOpen, setDockedOpen] = useAtom(dockedOpenAtom);
  const [floatingOpen, setFloatingOpen] = React.useState(false);
  const open = docked ? dockedOpen : floatingOpen;

  // The shell reads this to reserve the pane's column; it is not a React prop
  // because the player sits outside the page layout.
  React.useEffect(() => {
    if (!(docked && open)) return;
    const root = document.documentElement;
    root.dataset.queue = "open";
    return () => root.removeAttribute("data-queue");
  }, [docked, open]);

  return {
    docked,
    open,
    setOpen: docked ? setDockedOpen : setFloatingOpen,
  };
}

type QueueProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const sectionLabel =
  "flex items-center justify-between px-2 pt-3 pb-1 text-[0.6875rem]/4 font-semibold tracking-[0.06em] text-muted-foreground uppercase";

export function Queue({ open, onOpenChange }: QueueProps) {
  const [queue, setQueue] = useQueue();
  const [currentIndex, setCurrentIndex] = useCurrentSongIndex();
  const current = queue[currentIndex];
  const upNext = queue.length - currentIndex - 1;

  // Rows mount on first open, so a closed pane costs nothing, and stay
  // mounted afterwards so the exit transition keeps its content.
  const [hasOpened, setHasOpened] = React.useState(open);
  if (open && !hasOpened) setHasOpened(true);

  const paneRef = React.useRef<HTMLElement>(null);
  useKeydown((event) => {
    if (
      event.key === "Escape" &&
      event.target instanceof Node &&
      paneRef.current?.contains(event.target)
    ) {
      onOpenChange(false);
    }
  });

  function clearUpNext() {
    setQueue(queue.slice(0, currentIndex + 1));
    setCurrentIndex(currentIndex);
  }

  return (
    <aside
      id="player-queue"
      ref={paneRef}
      aria-label="Queue"
      inert={!open}
      className={cn(
        "fixed z-45 flex flex-col overflow-hidden rounded-lg border border-border bg-card text-card-foreground transition-[opacity,translate,visibility] duration-base ease-spring",
        "right-3 bottom-[calc(9.75rem+env(safe-area-inset-bottom))] left-3 h-[min(28rem,calc(100dvh-12rem))]",
        "md:bottom-23 md:left-auto md:h-[min(34rem,calc(100dvh-7.5rem))] md:w-[min(22rem,calc(100vw-1.5rem))]",
        "min-[1440px]:inset-y-2 min-[1440px]:right-2 min-[1440px]:h-auto min-[1440px]:w-(--queue-w) min-[1440px]:rounded-xl",
        open
          ? "visible opacity-100"
          : "invisible translate-y-2 opacity-0 min-[1440px]:translate-x-full min-[1440px]:translate-y-0",
      )}
    >
      <div className="flex h-14 shrink-0 items-center justify-between pr-3 pl-5">
        <h2 className="text-sm/5 font-bold text-foreground">
          Queue{" "}
          <span className="font-normal text-muted-foreground">
            {queue.length} {queue.length === 1 ? "Track" : "Tracks"}
          </span>
        </h2>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Close queue"
          onClick={() => onOpenChange(false)}
          className={controlStyles.headerIcon}
        >
          <X aria-hidden className="size-5" />
        </Button>
      </div>
      {hasOpened && (
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4 min-[1440px]:pb-28">
          {current && (
            <div className="hidden px-2 pb-4 min-[1440px]:block">
              <div className="relative aspect-square overflow-hidden rounded-md">
                <ImageWithFallback
                  src={getImageSrc(current.image, "high")}
                  alt=""
                  fill
                  sizes="320px"
                  fallback={getPlaceholderSrc("song")}
                  className="object-cover"
                />
                <Skeleton className="absolute inset-0 -z-10" />
              </div>
            </div>
          )}
          {current && (
            <>
              <h3 className={sectionLabel}>Now playing</h3>
              <div className="px-2 py-1">
                <p className="truncate text-[0.8125rem]/5 font-medium text-foreground">
                  {current.name}
                </p>
                <p className="truncate text-xs/4 text-muted-foreground">
                  {current.subtitle}
                </p>
              </div>
            </>
          )}
          <h3 className={sectionLabel}>
            Up next
            {upNext > 0 && (
              <button
                type="button"
                onClick={clearUpNext}
                className="rounded-sm text-[0.8125rem]/5 font-semibold tracking-normal text-primary normal-case"
              >
                Clear
              </button>
            )}
          </h3>
          <QueueList upNextOnly />
          {upNext === 0 && (
            <p className="px-2 text-sm text-muted-foreground">
              Nothing queued. Autoplay continues with similar songs.
            </p>
          )}
        </div>
      )}
    </aside>
  );
}
