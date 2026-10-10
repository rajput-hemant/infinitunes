import type { Quality, MediaType } from "@infinitunes/types";
import { decode, getImageSrc, parseToken } from "@infinitunes/types";
import { Badge } from "@infinitunes/ui/components/badge";
import { Card, CardContent } from "@infinitunes/ui/components/card";
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
  const href = isRadio ? getHref(url, "radio") : getHref(url, type);
  const isExplicit =
    typeof explicit === "string" ? explicit === "true" : Boolean(explicit);

  return (
    <Card
      title={name}
      className={cn(
        "group w-32 shrink-0 cursor-pointer gap-0 border-none bg-transparent py-0 shadow-none ring-0 transition-shadow duration-200 hover:bg-accent hover:shadow-md sm:w-36 sm:border-solid md:w-48 lg:w-56",
        aspect === "video" && "w-44 border-none! sm:w-48 md:w-64 lg:w-72",
        isCurrentSeason &&
          "ring-2 ring-ring ring-offset-2 ring-offset-background",
        className,
      )}
    >
      <CardContent className="size-full p-2">
        <div
          className={cn(
            "relative w-full overflow-hidden rounded-md",
            aspect === "square" ? "aspect-square" : "aspect-video",
            ["radio_station", "artist"].includes(type) && "rounded-full border",
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
              "size-full object-cover transition-transform duration-300 group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100",
              !imageSrc && "dark:invert",
              imageSrc.includes("default") && "dark:invert",
            )}
          />

          <Skeleton className="absolute inset-0 -z-10 size-full hover:scale-110" />

          {!hidePlayButton && (
            // Image scrim: stays black in both themes so the play button reads over any artwork.
            <div className="absolute inset-0 hidden from-transparent to-black group-focus-within:bg-linear-to-b group-hover:bg-linear-to-b lg:group-focus-within:flex lg:group-hover:flex">
              <PlayButton
                aria-label={`Play ${name}`}
                type={type}
                token={parseToken(url)}
                className="group/play z-20 m-auto aspect-square w-12 rounded-full bg-muted/75 transition-transform duration-150 ease-out pointer-fine:hover:scale-105 pointer-fine:active:scale-100 motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100"
              >
                <Play strokeWidth={10} className="m-auto h-full w-6 p-0.5" />
              </PlayButton>
            </div>
          )}
        </div>

        <div className="mt-1 flex w-full flex-col items-center justify-between">
          <h3 className="w-full font-semibold lg:text-lg">
            {href ? (
              <Link
                href={href}
                className="mx-auto flex max-w-fit min-w-0 items-center rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {isExplicit && (
                  <Badge className="mr-1 rounded px-1 py-0 font-bold duration-0">
                    <span aria-hidden="true">E</span>
                    <span className="sr-only">Explicit</span>
                  </Badge>
                )}
                <span className="truncate">{name}</span>
              </Link>
            ) : (
              <div className="mx-auto flex max-w-fit items-center">
                {isExplicit && (
                  <Badge className="mr-1 rounded px-1 py-0 font-bold duration-0">
                    <span aria-hidden="true">E</span>
                    <span className="sr-only">Explicit</span>
                  </Badge>
                )}
                <span className="truncate">{name}</span>
              </div>
            )}
          </h3>

          <span className="w-full truncate text-center text-xs capitalize text-secondary-foreground">
            {subtitle}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
