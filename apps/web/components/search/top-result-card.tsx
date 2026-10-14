import { decode, getImageSrc, parseToken } from "@infinitunes/types";
import { buttonVariants } from "@infinitunes/ui/components/button";
import { Play } from "lucide-react";
import Link from "next/link";

import { controlStyles } from "~/lib/control-styles";
import { cn } from "~/lib/utils";

import { ImageWithFallback } from "../image-with-fallback";
import { getPlaceholderSrc } from "../placeholder-src";
import { PlayButton } from "../play-button";
import type { SearchItem } from "./search-item";
import { getSearchItemHref } from "./search-item";
import { searchUi } from "./search-ui";

type TopResultCardProps = {
  item: SearchItem;
};

export function TopResultCard({ item }: TopResultCardProps) {
  const subtitle = item.subtitle ?? item.extra;

  return (
    <div
      className={cn(
        searchUi.panel,
        "relative grid gap-3 transition-[background-color,transform] duration-fast hover:bg-fill dark:hover:bg-fill-2 active:scale-99 motion-reduce:active:scale-100",
      )}
    >
      <div
        className={cn(
          "relative size-24 overflow-hidden rounded-md shadow-sm",
          item.type === "artist" && "rounded-full",
        )}
      >
        <ImageWithFallback
          src={getImageSrc(item.image, "medium")}
          alt=""
          fill
          sizes="96px"
          fallback={getPlaceholderSrc(item.type)}
          className="object-cover"
        />
      </div>

      <div className="min-w-0">
        <h3 className="font-heading text-xl leading-7 font-bold tracking-tight">
          <Link
            href={getSearchItemHref(item)}
            className="rounded-sm outline-hidden after:absolute after:inset-0 after:rounded-md focus-visible:after:ring-2 focus-visible:after:ring-ring"
          >
            {decode(item.title)}
          </Link>
        </h3>
        {subtitle ? (
          <p className="text-muted-foreground">{decode(subtitle)}</p>
        ) : null}
      </div>

      {item.perma_url ? (
        <div>
          <PlayButton
            type={item.type}
            token={parseToken(item.perma_url)}
            aria-label={`Play ${decode(item.title)}`}
            className={cn(
              buttonVariants(),
              controlStyles.hero,
              "relative z-10",
            )}
          >
            <Play aria-hidden="true" className="size-4 fill-current" />
            Play
          </PlayButton>
        </div>
      ) : null}
    </div>
  );
}
