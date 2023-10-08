import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";

import { Quality, Type } from "@/types";
import { cn, getHref } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  id: string;
  url: string;
  type: Type;
  image: Quality;
  name: string;
  subtitle: string | undefined;
};

export function ItemCard({ id, url, type, image, name, subtitle }: Props) {
  const Slot = type === "song" ? "div" : Link;

  return (
    <Slot key={id} href={getHref(url, type)}>
      <Card className="group w-36 cursor-pointer bg-transparent transition-shadow duration-200 hover:bg-secondary hover:shadow-md md:w-48 lg:w-56">
        <CardContent className="h-full w-full p-2">
          <div
            className={cn(
              "relative aspect-square w-full overflow-hidden rounded-md",
              type === "radio_station" && "rounded-full"
            )}
          >
            <Image
              src={typeof image === "string" ? image : image[2].link}
              width={200}
              height={200}
              alt={name}
              className="h-full w-full object-cover duration-300 group-hover:scale-110"
            />

            <div className="group/play absolute inset-[calc(50%-2rem)] z-10 m-2 hidden rounded-full bg-muted/75 duration-200 hover:m-0 group-hover:block">
              <Play
                strokeWidth={10}
                className="m-auto h-full w-6 p-1 duration-200 group-hover/play:w-8"
              />
            </div>

            <Skeleton className="absolute inset-0 -z-10 h-full w-full hover:scale-110" />
          </div>

          <div className="mt-1 flex w-full flex-col items-center justify-between px-2">
            <span className="w-full truncate text-center text-sm font-semibold">
              {name}
            </span>

            <span className="w-full truncate text-center text-xs text-secondary-foreground/75">
              {subtitle}
            </span>
          </div>
        </CardContent>
      </Card>
    </Slot>
  );
}
