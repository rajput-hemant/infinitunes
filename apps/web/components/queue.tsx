"use client";

import { getImageSrc, parseToken, removeFromQueue } from "@infinitunes/types";
import { Button } from "@infinitunes/ui/components/button";
import { ScrollArea, ScrollBar } from "@infinitunes/ui/components/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@infinitunes/ui/components/sheet";
import { Skeleton } from "@infinitunes/ui/components/skeleton";
import { ListOrdered, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { useCurrentSongIndex, useQueue } from "~/hooks/use-store";
import { getHref } from "~/lib/utils";

import { TilePlayPauseButton } from "./song-list/play-pause-button";

/** Exit transition length; the row is removed from state once it finishes. */
const REMOVE_MS = 200;

/** The queue rows, shared by the desktop sheet and the mobile player sheet. */
export function QueueList() {
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
      {queue.map((item) => (
        <li
          key={item.queueItemId}
          data-leaving={leaving.has(item.queueItemId) ? "" : undefined}
          inert={leaving.has(item.queueItemId)}
          aria-hidden={leaving.has(item.queueItemId) || undefined}
          className="grid w-full grid-rows-[1fr] transition-[grid-template-rows,opacity,translate] duration-200 ease-out data-leaving:-translate-x-2 data-leaving:grid-rows-[0fr] data-leaving:opacity-0"
        >
          <div className="min-h-0 overflow-hidden pb-2">
            <div className="group relative flex min-h-14 w-full cursor-pointer items-center justify-between truncate rounded-md border px-2 text-sm transition-shadow duration-150 hover:shadow-md">
              <figure className="flex w-full items-center gap-4 overflow-hidden">
                <div className="relative aspect-square h-11 min-w-fit lg:h-10 overflow-hidden rounded">
                  <Image
                    src={getImageSrc(item.image, "low")}
                    alt=""
                    fill
                    sizes="44px"
                    className="z-10 object-cover duration-300 group-hover:brightness-50"
                  />

                  <Skeleton className="absolute inset-0 rounded" />

                  <TilePlayPauseButton
                    id={item.id}
                    type={item.type}
                    token={parseToken(item.url)}
                    queueItemId={item.queueItemId}
                  />
                </div>

                <figcaption className="flex min-w-0 flex-1 flex-col">
                  <h4 className="w-full truncate font-semibold">
                    <Link
                      href={getHref(
                        item.url,
                        item.type === "song" ? "song" : "episode",
                      )}
                      className="flex min-h-11 items-center text-primary group-hover:text-primary after:absolute after:inset-0 lg:min-h-0 lg:text-muted-foreground"
                    >
                      {item.name}
                    </Link>
                  </h4>

                  <ScrollArea className="w-full max-w-[400px] pb-1">
                    {item.artists.map((artist, i, arr) => (
                      <Link
                        key={artist.id}
                        href={getHref(artist.perma_url, "artist")}
                        className="relative z-10 w-full truncate hover:text-foreground"
                      >
                        {artist.name}
                        {i !== arr.length - 1 && ", "}
                      </Link>
                    ))}

                    <ScrollBar orientation="horizontal" className="h-1.5" />
                  </ScrollArea>
                </figcaption>

                <Button
                  variant="ghost"
                  data-queue-remove=""
                  aria-label={`Remove ${item.name} from queue`}
                  disabled={leaving.has(item.queueItemId)}
                  tabIndex={leaving.has(item.queueItemId) ? -1 : undefined}
                  onClick={() => removeItem(item.queueItemId)}
                  className="relative z-10 ml-auto size-11 shrink-0 p-0 lg:size-8 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <X aria-hidden className="size-4" />
                </Button>
              </figure>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function Queue() {
  const [queue] = useQueue();

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            size="icon"
            variant="ghost"
            aria-label="Open queue"
            className="shrink-0"
          >
            <ListOrdered aria-hidden />
          </Button>
        }
      />

      <SheetContent
        dir="right"
        className="flex flex-col space-y-2 px-2 sm:max-w-xl!"
      >
        <SheetHeader className="space-y-0 px-4">
          <SheetTitle className="flex items-center justify-between pr-4">
            <span className="font-heading text-2xl capitalize tracking-wide drop-shadow-md text-foreground sm:text-3xl md:text-4xl">
              Queue
            </span>
            <span>
              {queue.length} {queue.length === 1 ? "Track" : "Tracks"}
            </span>
          </SheetTitle>
          <SheetDescription>
            View and manage the songs in your queue
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="px-4">
          <QueueList />

          <ScrollBar orientation="vertical" />
        </ScrollArea>

        {/* <SheetFooter className="px-4">
          <Button>Submit</Button>
          <SheetClose>
            <Button variant="outline">Cancel</Button>
          </SheetClose>
        </SheetFooter> */}
      </SheetContent>
    </Sheet>
  );
}
