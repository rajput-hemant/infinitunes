import type { Quality, MediaType } from "@infinitunes/types";
import { decode, getImageSrc, parseToken } from "@infinitunes/types";
import { Badge } from "@infinitunes/ui/components/badge";
import { Skeleton } from "@infinitunes/ui/components/skeleton";
import { Play } from "lucide-react";
import Link from "next/link";

import { cn, getHref } from "~/lib/utils";

import { ImageWithFallback } from "../image-with-fallback";
import { getPlaceholderSrc } from "../placeholder-src";
import { PlayButton } from "../play-button";

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
    className,
  } = props;

  const name = decode(rawName);
  const subtitle = rawSubtitle ? decode(rawSubtitle) : rawSubtitle;
  const imageSrc = getImageSrc(image, "high");
  const isRadio = type === "radio_station";
  const round = isRadio || type === "artist";
  const href = isRadio ? getHref(url, "radio") : getHref(url, type);
  const isExplicit =
    typeof explicit === "string" ? explicit === "true" : Boolean(explicit);

  const label = (
    <>
      {isExplicit && (
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
      className={cn(
        "group flex min-w-0 flex-col gap-2",
        isCurrentSeason &&
          "rounded-md ring-2 ring-ring ring-offset-2 ring-offset-background",
        className,
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden bg-fill shadow-sm transition-[transform,box-shadow] duration-base ease-spring group-hover:shadow-md group-active:scale-98",
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
          alt={name}
          className={cn(
            "size-full object-cover",
            !imageSrc && "dark:invert",
            imageSrc.includes("default") && "dark:invert",
          )}
        />

        <Skeleton className="absolute inset-0 -z-10 size-full" />

        {!hidePlayButton && (
          <PlayButton
            aria-label={`Play ${name}`}
            type={type}
            token={parseToken(url)}
            className="absolute right-2 bottom-2 z-20 flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition duration-base ease-spring pointer-fine:translate-y-1.5 pointer-fine:scale-90 pointer-fine:opacity-0 group-focus-within:translate-y-0 group-focus-within:scale-100 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100 motion-reduce:transition-none"
          >
            <Play className="size-4 fill-current" />
          </PlayButton>
        )}
      </div>

      <div
        className={cn(
          "flex min-w-0 flex-col",
          round && "items-center text-center",
        )}
      >
        <h3 className="w-full text-[0.8125rem] leading-5 font-semibold">
          {href ? (
            <Link
              href={href}
              className="flex max-w-full min-w-0 items-center rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {label}
            </Link>
          ) : (
            <span className="flex max-w-full min-w-0 items-center">
              {label}
            </span>
          )}
        </h3>

        {subtitle && (
          <span className="w-full truncate text-xs leading-4 text-muted-foreground capitalize">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
