import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";

import type { Quality, Type } from "@/types";

import { cn, getHref, getImageSrc } from "@/lib/utils";
import { PlayButton } from "./play-button";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { H4 } from "./ui/topography";

type Props = {
  url: string;
  type: Type;
  image: Quality;
  name: string;
  explicit?: boolean;
  subtitle?: string;
  className?: string;
  aspect?: "square" | "video";
};

export function ItemCard({
  url,
  type,
  image,
  name,
  subtitle,
  explicit,
  aspect = "square",
  className,
}: Props) {
  const imageSrc = getImageSrc(image, "high");
  const Wrapper = type === "radio_station" ? "div" : Link;

  return (
    <Card
      title={name}
      className={cn(
        "group w-32 cursor-pointer border-none bg-transparent transition-shadow duration-200 hover:bg-secondary hover:shadow-md sm:w-36 sm:border-solid md:w-48 lg:w-56",
        type === "artist" && "border-none !shadow-none hover:bg-transparent",
        aspect === "video" && "w-44 !border-none sm:w-48 md:w-64 lg:w-72",
        className
      )}
    >
      <CardContent className="size-full p-2">
        <div
          className={cn(
            "relative w-full overflow-hidden rounded-md",
            aspect === "square" ? "aspect-square" : "aspect-video",
            ["radio_station", "artist"].includes(type) && "rounded-full border"
          )}
        >
          <Wrapper href={getHref(url, type)} className="absolute inset-0 z-10">
            <span className="sr-only">View {name}</span>
          </Wrapper>

          <Image
            src={imageSrc || `/images/placeholder/${type}.jpg`}
            width={200}
            height={200}
            alt={name}
            className={cn(
              "size-full object-cover duration-300 group-hover:scale-110",
              !imageSrc && "duration-0 dark:invert",
              imageSrc.includes("default") && "dark:invert"
            )}
          />

          <Skeleton className="absolute inset-0 -z-10 size-full hover:scale-110" />

          <div className="absolute inset-0 hidden from-transparent to-black group-hover:bg-gradient-to-b lg:group-hover:flex">
            <PlayButton
              type={type}
              token={url.split("/").pop()!}
              className="group/play z-20 m-auto aspect-square w-12 rounded-full bg-muted/75 duration-200 hover:w-16 active:w-14"
            >
              <Play
                strokeWidth={10}
                className="m-auto h-full w-6 p-1 duration-200 group-hover/play:w-8"
              />
            </PlayButton>

            {/* <div className="text-primary-foreground dark:text-secondary-foreground flex justify-between">
                <LikeButton />

                <button className="rounded-full">
                  <MoreVertical className="h-6 w-6" />
                </button>
              </div> */}
          </div>
        </div>

        <div className="mt-1 flex w-full flex-col items-center justify-between">
          <H4 className="w-full lg:text-lg">
            <Wrapper
              href={getHref(url, type)}
              className="mx-auto flex max-w-fit items-center"
            >
              {explicit && (
                <Badge className="mr-1 rounded px-1 py-0 font-bold duration-0">
                  E
                </Badge>
              )}
              <span className="truncate">{name}</span>
            </Wrapper>
          </H4>

          <span className="w-full truncate text-center text-xs capitalize text-secondary-foreground/75">
            {subtitle}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
