import { getImageSrc } from "@infinitunes/types";
import type { ActiveRadioSession, Queue } from "@infinitunes/types";
import { Skeleton } from "@infinitunes/ui/components/skeleton";
import { MoveUpRight, Radio } from "lucide-react";
import Link from "next/link";

import { ImageWithFallback } from "~/components/image-with-fallback";
import { getHref } from "~/lib/utils";

import { useSwipe } from "./use-swipe";

// Distance a drag on the mini player must travel upward to open the expanded view.
const SWIPE_UP_PX = 40;

type PlayerTrackInfoProps = {
  track: Queue | undefined;
  radio: ActiveRadioSession | null;
  onExpand: () => void;
};

/** The artwork and title block at the start of the mini player. */
export function PlayerTrackInfo({
  track,
  radio,
  onExpand,
}: PlayerTrackInfoProps) {
  const swipe = useSwipe({
    direction: "up",
    distance: SWIPE_UP_PX,
    onSwipe: onExpand,
  });

  return (
    <div
      className="relative flex min-w-0 items-center gap-3"
      onTouchStart={swipe.onTouchStart}
      onTouchEnd={swipe.onTouchEnd}
    >
      {track && (
        // Below md the transport row is the only other control, so the
        // whole info area opens the expanded player.
        <button
          type="button"
          aria-label="Open player"
          onClick={onExpand}
          className="absolute inset-0 z-10 rounded-full md:hidden"
        />
      )}
      {track?.image ? (
        <>
          <div className="relative size-10 shrink-0 overflow-hidden rounded-[max(0.25rem,calc(var(--pl-r)-0.625rem))] max-md:rounded-full md:size-12">
            <ImageWithFallback
              src={getImageSrc(track.image, "low")}
              alt={track.name}
              fill
              sizes="48px"
              fallback="/images/placeholder/song.jpg"
            />

            <Skeleton className="absolute inset-0 -z-10" />
          </div>

          <div className="flex min-w-0 flex-col justify-center">
            <Link
              href={getHref(
                track.url,
                track.type === "song" ? "song" : "episode",
              )}
              className="group line-clamp-1 text-sm/5 font-semibold text-foreground hover:text-primary"
            >
              {track.name}
              <MoveUpRight
                aria-hidden
                className="invisible mb-1 ml-1 inline-flex size-3 group-hover:visible"
              />
            </Link>

            <p className="line-clamp-1 flex items-center gap-1.5 text-xs/4 text-muted-foreground">
              {radio && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-sm bg-primary/10 px-1.5 py-0.5 text-[0.625rem] font-medium text-primary">
                  <Radio aria-hidden className="size-2.5 animate-pulse" />
                  {radio.name}
                </span>
              )}
              <span className="truncate">{track.subtitle}</span>
            </p>
          </div>
        </>
      ) : (
        <div className="flex items-center space-x-4">
          <Skeleton className="size-12 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-44 lg:w-64" />
            <Skeleton className="h-3 w-52 2xl:w-[500px]" />
          </div>
        </div>
      )}
    </div>
  );
}
