"use client";

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
import { toast } from "sonner";

import { useQueue } from "~/hooks/use-store";
import { getHref, getImageSrc } from "~/lib/utils";
import type { Queue } from "~/types";

import { TilePlayPauseButton } from "./song-list/play-pause-button";

export function Queue() {
  const [queue, setQueue] = useQueue();

  function removeFromQueue(id: string) {
    let song: Queue;

    setQueue((prev) =>
      prev.filter((item) => {
        if (item.id === id) {
          song = item;
          return false;
        }

        return true;
      }),
    );

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (song) {
      toast("Removed from queue", {
        description: `Removed "${song.title}" from the queue`,
        duration: 10000,
      });
    }
  }

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button size="icon" variant="ghost" className="shrink-0">
            <ListOrdered />
          </Button>
        }
      />

      <SheetContent
        dir="right"
        className="flex flex-col space-y-2 px-2 md:max-w-xl"
      >
        <SheetHeader className="space-y-0 px-4">
          <SheetTitle className="flex items-center justify-between pr-4">
            <span className="font-heading text-2xl capitalize tracking-wide drop-shadow-md dark:bg-linear-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-3xl md:text-4xl">
              Queue
            </span>
            <span>
              {queue.length} Track{`${queue.length > 1 ? "s" : ""}`}
            </span>
          </SheetTitle>
          <SheetDescription>
            View and manage the songs in your queue
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="px-4">
          <ol className="space-y-2 text-muted-foreground">
            {queue.map((item) => (
              <li key={item.id} className="w-full">
                <div className="group flex h-14 w-full cursor-pointer items-center justify-between truncate rounded-md border px-2 text-sm transition-shadow duration-150 hover:shadow-md">
                  <figure className="flex w-full items-center gap-4 overflow-hidden">
                    <div className="relative aspect-square h-10 min-w-fit overflow-hidden rounded">
                      <Image
                        src={getImageSrc(item.image, "low")}
                        alt={item.title}
                        fill
                        className="z-10 object-cover duration-300 group-hover:brightness-50"
                      />

                      <Skeleton className="absolute inset-0 rounded" />

                      <TilePlayPauseButton
                        id={item.id}
                        type={item.type}
                        token={item.perma_url.split("/").pop()!}
                      />
                    </div>

                    <figcaption className="flex flex-col">
                      <h4 className="w-full truncate font-semibold">
                        <Link
                          href={getHref(
                            item.perma_url,
                            item.type === "song" ? "song" : "episode",
                          )}
                          className="text-primary group-hover:text-primary lg:text-muted-foreground"
                        >
                          {item.title}
                        </Link>
                      </h4>

                      <ScrollArea className="w-full max-w-[400px] pb-1">
                        {item.artists.map((artist, i, arr) => (
                          <Link
                            key={artist.id}
                            href={getHref(artist.perma_url, "artist")}
                            className="w-full truncate hover:text-foreground"
                          >
                            {artist.title}
                            {i !== arr.length - 1 && ", "}
                          </Link>
                        ))}

                        <ScrollBar orientation="horizontal" className="h-1.5" />
                      </ScrollArea>
                    </figcaption>

                    <Button
                      variant="ghost"
                      onClick={() => removeFromQueue(item.id)}
                      className="ml-auto size-5 p-0.5 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <X className="size-4" />
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
