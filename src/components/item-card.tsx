import Image from "next/image";
import Link from "next/link";
import { MoreVertical, Play } from "lucide-react";

import { Quality, Type } from "@/types";
import { cn, getHref, getImageSrc } from "@/lib/utils";
import LikeButton from "./like-button";
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
        "hover:bg-secondary group w-36 cursor-pointer bg-transparent transition-shadow duration-200 hover:shadow-md md:w-48 lg:w-56",
        type === "artist" && "border-none !shadow-none hover:bg-transparent",
        className
      )}
    >
      <CardContent className="h-full w-full p-2">
        <Wrapper href={getHref(url, type)}>
          <div
            className={cn(
              "relative w-full overflow-hidden rounded-md",
              aspect === "square" ? "aspect-square" : "aspect-video",
              ["radio_station", "artist"].includes(type) &&
                "rounded-full border"
            )}
          >
            <Image
              src={imageSrc || `/images/placeholder/${type}.jpg`}
              width={200}
              height={200}
              alt={name}
              className={cn(
                "h-full w-full object-contain duration-300 group-hover:scale-110",
                !imageSrc && "duration-0 dark:invert",
                imageSrc.includes("default") && "dark:invert"
              )}
            />

            <Skeleton className="absolute inset-0 -z-10 h-full w-full hover:scale-110" />

            <div className="absolute inset-0 hidden flex-col justify-between from-transparent via-black/75 to-black p-2 group-hover:flex group-hover:bg-gradient-to-b">
              <span className="bg-primary text-secondary m-1 ml-auto rounded px-1 text-sm font-bold">
                {explicit && "E"}
              </span>

              <div className="group/play bg-muted/75 mx-auto aspect-square w-12 rounded-full duration-200 hover:w-16">
                <Play
                  strokeWidth={10}
                  className="m-auto h-full w-6 p-1 duration-200 group-hover/play:w-8"
                />
              </div>

              <div className="text-primary-foreground dark:text-secondary-foreground flex justify-between">
                <LikeButton />

                <button className="rounded-full">
                  <MoreVertical className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>
        </Wrapper>

        <div className="mt-1 flex w-full flex-col items-center justify-between">
          <H4 className="w-full truncate text-center lg:text-lg">
            <Wrapper href={getHref(url, type)}>{name}</Wrapper>
          </H4>

          <span className="text-secondary-foreground/75 w-full truncate text-center text-xs capitalize">
            {subtitle}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
