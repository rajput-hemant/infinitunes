"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  ListMusic,
  ListOrdered,
  MoreVertical,
  Play,
  Radio,
  Share2,
} from "lucide-react";

import type { Quality, Song, Type } from "@/types";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useQueue } from "@/hooks/use-store";
import { getImageSrc } from "@/lib/utils";
import { ShareOptions } from "./share-options";
import { ShareSubMenu } from "./share-submenu";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Separator } from "./ui/separator";
import { Skeleton } from "./ui/skeleton";

type Props = {
  type: Type;
  image: Quality;
  name: string;
  subtitle: string;
  songs: Song[];
};

type MenuItem = {
  label: string;
  onClick: () => void;
  hide?: boolean;
  icon: ({ className }: { className: string }) => JSX.Element;
};

export const DetailsHeaderMoreButton = ({
  name,
  subtitle,
  type,
  image,
  songs,
}: Props) => {
  const [, setQueue] = useQueue();
  const [traslateX, setTranslateX] = useState(0);

  function play() {}

  function addToQueue() {
    const songsPayload = songs.map(
      ({
        id,
        name,
        subtitle,
        type,
        url,
        image,
        download_url,
        artist_map: { artists },
      }) => ({
        id,
        name,
        subtitle,
        url,
        type,
        image,
        download_url,
        artists,
      })
    );

    setQueue((prev) => [...prev, ...songsPayload]);
  }

  function addToPlaylist() {}

  function playRadio() {}

  const menuItems: MenuItem[] = [
    {
      label: "Play Now",
      onClick: play,
      icon: ({ className }) => <Play className={className} />,
    },
    {
      label: "Add to Queue",
      onClick: addToQueue,
      hide: type === "show" || type === "artist",
      icon: ({ className }) => <ListOrdered className={className} />,
    },
    {
      label: "Add To Playlist",
      onClick: addToPlaylist,
      hide: type === "show" || type === "artist" || type === "episode",
      icon: ({ className }) => <ListMusic className={className} />,
    },
    {
      label: "Play Radio",
      onClick: playRadio,
      hide: type === "show" || type === "mix",
      icon: ({ className }) => <Radio className={className} />,
    },
  ];

  return (
    <>
      {/* sheet for small devices */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            size="icon"
            variant="outline"
            className="rounded-full lg:hidden"
          >
            <MoreVertical className="size-6 lg:hidden" />
          </Button>
        </SheetTrigger>

        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader>
            <div className="flex gap-2">
              <div className="relative aspect-square h-14 rounded-md">
                <Image
                  src={getImageSrc(image, "low")}
                  alt={name}
                  fill
                  className="z-10 rounded-md"
                />

                <Skeleton className="absolute inset-0 size-full" />
              </div>

              <div className="flex flex-col truncate text-start">
                <SheetTitle className="truncate">{name}</SheetTitle>

                <SheetDescription className="truncate">
                  {subtitle}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <Separator className="my-4" />

          <div
            className="relative flex min-h-[300px] flex-col gap-4 transition-transform duration-300"
            style={{ transform: `translateX(${traslateX}%)` }}
          >
            {menuItems
              .filter(({ hide }) => !hide)
              .map(({ icon: Icon, label, onClick }, i) => (
                <button
                  key={i}
                  onClick={onClick}
                  className="flex h-8 items-center font-medium"
                >
                  <Icon className="mr-2 size-5" />
                  {label}
                </button>
              ))}

            <button
              onClick={() => setTranslateX(-110)}
              className="flex h-8 items-center font-medium"
            >
              <Share2 className="mr-2 size-5" />
              Share
              <ChevronRight className="ml-auto size-5" />
            </button>

            <div className="absolute inset-y-0 left-[110%] flex min-w-full flex-col gap-4 bg-background">
              <button
                onClick={() => setTranslateX(0)}
                className="flex h-8 items-center font-medium"
              >
                <ChevronLeft className="mr-2 size-5" />
                Back
              </button>

              <Separator />

              <ShareOptions className="flex h-8 cursor-pointer items-center font-medium" />
            </div>
          </div>

          <Separator className="my-4" />

          <SheetFooter className="sm:justify-center">
            <SheetClose>Cancel</SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* dropdown for large devices */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            variant="outline"
            className="hidden rounded-full lg:inline-flex"
          >
            <MoreVertical className="size-6" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="p-2">
          <DropdownMenuGroup>
            {menuItems
              .filter(({ hide }) => !hide)
              .map(({ icon: Icon, label, onClick }, i) => (
                <DropdownMenuItem key={i} onClick={onClick}>
                  <Icon className="mr-2 size-5" />
                  {label}
                </DropdownMenuItem>
              ))}

            <ShareSubMenu />
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
