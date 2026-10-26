import type { Quality, MediaType } from "@infinitunes/types";
import {
  decode,
  getImageSrc,
  isExplicit,
  parseToken,
} from "@infinitunes/types";
import { Badge } from "@infinitunes/ui/components/badge";
import { Skeleton } from "@infinitunes/ui/components/skeleton";
import Link from "next/link";

import { cn, getHref } from "~/lib/utils";

import { CardPlay } from "../card-play";
import { ImageWithFallback } from "../image-with-fallback";
import { getPlaceholderSrc } from "../placeholder-src";

/** Cards in a catalog grid's first row: above the fold, so they load eagerly. */
export const FIRST_ROW_CARDS = 6;

export type SliderCardProps = {
  name: string;
  type: MediaType;
  url: string;
  image: Quality;
  explicit?: boolean | string;
  subtitle?: string;
  className?: string;
  aspect?: "square" | "video";
  hidePlayButton?: boolean;
  isCurrentSeason?: boolean;
  /** Above the fold (the LCP candidate): load eagerly at high fetch priority. */
  priority?: boolean;
};

export function SliderCard(props: SliderCardProps) {
  const {
    url,
    type,
    image,
    name: rawName,
    subtitle: rawSubtitle,
    explicit,
    aspect = "square",
    hidePlayButton,
    isCurrentSeason,
    priority,
    className,
  } = props;

  const name = decode(rawName);
  const subtitle = rawSubtitle ? decode(rawSubtitle) : rawSubtitle;
  const imageSrc = getImageSrc(image, "high");
  const isRadio = type === "radio_station";
  const round = isRadio || type === "artist";
  const href = isRadio ? getHref(url, "radio") : getHref(url, type);

  const titleClass = cn(
    "max-w-full min-w-0 items-center rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
    round ? "inline-flex" : "flex",
  );

  const label = (
    <>
      {isExplicit(explicit) && (
        <Badge className="mr-1 rounded px-1 py-0 font-bold duration-0">
          <span aria-hidden="true">E</span>
          <span className="sr-only">Explicit</span>
        </Badge>
      )}
      <span className="truncate">{name}</span>
    </>
  );

  return (
    <div
      data-morph={type}
      className={cn(
        "group flex min-w-0 flex-col gap-2",
        isCurrentSeason &&
          "rounded-md ring-2 ring-ring ring-offset-2 ring-offset-background",
        className,
      )}
    >
      <div
        data-morph-art=""
        className={cn(
          "relative overflow-hidden bg-fill shadow-sm transition-[transform,box-shadow] duration-base ease-spring group-hover:-translate-y-0.5 group-hover:shadow-md group-active:translate-y-0 group-active:scale-98",
          aspect === "square" ? "aspect-square" : "aspect-video",
          round ? "rounded-full" : "rounded-md",
        )}
      >
        {href ? (
          <Link
            href={href}
            tabIndex={-1}
            aria-hidden="true"
            className="absolute inset-0 z-10"
          />
        ) : (
          <div className="absolute inset-0 z-10" />
        )}

        <ImageWithFallback
          src={imageSrc}
          fallback={getPlaceholderSrc(type)}
          width={200}
          height={200}
          alt=""
          loading={priority ? "eager" : undefined}
          fetchPriority={priority ? "high" : undefined}
          className={cn(
            "size-full object-cover transition-transform duration-slow ease-out group-hover:scale-105",
            !imageSrc && "dark:invert",
            imageSrc.includes("default") && "dark:invert",
          )}
        />

        <Skeleton className="absolute inset-0 -z-10 size-full" />

        {!hidePlayButton && (
          <CardPlay
            name={name}
            type={type}
            token={parseToken(url)}
            round={round}
          />
        )}
      </div>

      <div
        className={cn(
          "flex min-w-0 flex-col",
          round && "items-center text-center",
        )}
      >
        <h3
          className={cn(
            "w-full text-[0.8125rem] leading-5 font-semibold",
            round && "text-center",
          )}
        >
          {href ? (
            <Link href={href} className={titleClass}>
              {label}
            </Link>
          ) : (
            <span className={titleClass}>{label}</span>
          )}
        </h3>

        {subtitle && (
          <span
            className={cn(
              "w-full truncate text-xs leading-4 text-muted-foreground capitalize",
              round && "text-center",
            )}
          >
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
