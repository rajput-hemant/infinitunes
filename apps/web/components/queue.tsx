"use client";

import { getImageSrc, getToken, removeFromQueue } from "@infinitunes/types";
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

export function Queue() {
  const [queue, setQueue] = useQueue();
  const [currentIndex, setCurrentIndex] = useCurrentSongIndex();

  const listRef = React.useRef<HTMLOListElement>(null);

  function removeItem(id: string) {
    const index = queue.findIndex((item) => item.id === id);
    const song = queue.find((item) => item.id === id);
    const next = removeFromQueue(queue, currentIndex, id);

    setQueue(next.queue);
    setCurrentIndex(next.currentIndex);

    // The removed row takes focus with it: hand it to the row that took its
    // place (or the last row), or to the list itself once the queue is empty.
    requestAnimationFrame(() => {
      const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>(
        "[data-queue-remove]",
      );
      if (buttons?.length) {
        buttons[Math.min(index, buttons.length - 1)]?.focus();
      } else {
        listRef.current?.focus();
      }
    });

    if (song) {
      toast("Removed from queue", {
        description: `Removed "${song.name}" from the queue`,
        duration: 10000,
      });
    }
  }

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
            <span className="font-heading text-2xl capitalize tracking-wide drop-shadow-md dark:bg-linear-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-3xl md:text-4xl">
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
          <ol
            ref={listRef}
            tabIndex={-1}
            aria-label="Queue"
            className="space-y-2 text-muted-foreground outline-none"
          >
            {queue.map((item) => (
              <li key={item.id} className="w-full">
                <div className="group flex h-14 w-full cursor-pointer items-center justify-between truncate rounded-md border px-2 text-sm transition-shadow duration-150 hover:shadow-md">
                  <figure className="flex w-full items-center gap-4 overflow-hidden">
                    <div className="relative aspect-square h-10 min-w-fit overflow-hidden rounded">
                      <Image
                        src={getImageSrc(item.image, "low")}
                        alt=""
                        fill
                        sizes="40px"
                        className="z-10 object-cover duration-300 group-hover:brightness-50"
                      />

                      <Skeleton className="absolute inset-0 rounded" />

                      <TilePlayPauseButton
                        id={item.id}
                        type={item.type}
                        token={getToken(item.url)}
                      />
                    </div>

                    <figcaption className="flex flex-col">
                      <h4 className="w-full truncate font-semibold">
                        <Link
                          href={getHref(
                            item.url,
                            item.type === "song" ? "song" : "episode",
                          )}
                          className="text-primary group-hover:text-primary lg:text-muted-foreground"
                        >
                          {item.name}
                        </Link>
                      </h4>

                      <ScrollArea className="w-full max-w-[400px] pb-1">
                        {item.artists.map((artist, i, arr) => (
                          <Link
                            key={artist.id}
                            href={getHref(artist.perma_url, "artist")}
                            className="w-full truncate hover:text-foreground"
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
                      onClick={() => removeItem(item.id)}
                      className="ml-auto size-8 shrink-0 p-0 text-destructive hover:bg-destructive hover:text-white"
                    >
                      <X aria-hidden className="size-4" />
                    </Button>
                  </figure>
                </div>
              </li>
            ))}
          </ol>

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
