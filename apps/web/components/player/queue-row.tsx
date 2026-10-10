import { formatDuration, getImageSrc, parseToken } from "@infinitunes/types";
import type { Queue } from "@infinitunes/types";
import { Button } from "@infinitunes/ui/components/button";
import { Skeleton } from "@infinitunes/ui/components/skeleton";
import { X } from "lucide-react";
import Link from "next/link";

import { ImageWithFallback } from "~/components/image-with-fallback";
import { getPlaceholderSrc } from "~/components/placeholder-src";
import { ArtistLinks } from "~/components/song-list/artist-links";
import { TilePlayPauseButton } from "~/components/song-list/play-pause-button";
import { controlStyles } from "~/lib/control-styles";
import { cn, getHref } from "~/lib/utils";

type QueueRowProps = {
  item: Queue;
  /** The row is in its exit transition and no longer interactive. */
  isLeaving: boolean;
  onRemove: () => void;
};

export function QueueRow({ item, isLeaving, onRemove }: QueueRowProps) {
  return (
    <li
      data-leaving={isLeaving ? "" : undefined}
      inert={isLeaving}
      aria-hidden={isLeaving || undefined}
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
              disabled={isLeaving}
              tabIndex={isLeaving ? -1 : undefined}
              onClick={onRemove}
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
  );
}
