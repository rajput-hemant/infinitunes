"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  ListMusic,
  ListOrdered,
  MoreVertical,
  Play,
  Radio,
  Share2,
} from "lucide-react";

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
import {
  useCurrentSongIndex,
  useIsPlayerInit,
  useQueue,
} from "@/hooks/use-store";
import { getImageSrc } from "@/lib/utils";
import { Episode, Queue, Song } from "@/types";
import { ShareOptions } from "../share-options";
import { ShareSubMenu } from "../share-submenu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Separator } from "../ui/separator";
import { Skeleton } from "../ui/skeleton";
import { TileMoreLinks } from "./tile-more-links";

type Props = {
  item: Song | Episode | Queue;
  showAlbum: boolean;
};

type MenuItem = {
  label: string;
  onClick: () => void;
  hide?: boolean;
  icon: React.FC<{ className: string }>;
};

export const TileMoreButton = ({ item, showAlbum }: Props) => {
  const [, setIsPlayerInit] = useIsPlayerInit();
  const [initialQueue, setQueue] = useQueue();
  const [, setCurrentIndex] = useCurrentSongIndex();
  const [traslateX, setTranslateX] = useState(0);

  function like() {}

  function play() {
    if (item.type === "episode") return;

    const songIndex = initialQueue.findIndex((q) => q.id === item.id);

    if (songIndex !== -1) {
      setCurrentIndex(songIndex);
    } else {
      const {
        id,
        name,
        subtitle,
        type,
        url,
        image,
        artist_map: { featured_artists: artists },
        download_url,
      } = item as Song;

      const queue = {
        id,
        name,
        subtitle,
        type,
        url,
        image,
        artists,
        download_url,
      } satisfies Queue;

      setQueue([queue]);
      setCurrentIndex(0);
    }

    setIsPlayerInit(true);
  }

  function addToQueue() {
    if (item.type === "episode") return;

    let queue: Queue;

    if ("explicit" in item) {
      const {
        id,
        name,
        subtitle,
        type,
        url,
        image,
        artist_map: { featured_artists: artists },
        download_url,
      } = item;

      queue = {
        id,
        name,
        subtitle,
        type,
        url,
        image,
        artists,
        download_url,
      } satisfies Queue;
    } else {
      queue = item;
    }

    setQueue((q) => [...q, queue]);
  }

  function addToPlaylist() {}

  function playRadio() {}

  const menuItems: MenuItem[] = [
    {
      label: "Add To Favourite",
      onClick: like,
      icon: ({ className }) => <Heart className={className} />,
    },
    {
      label: "Play Song Now",
      onClick: play,
      icon: ({ className }) => <Play className={className} />,
    },
    {
      label: "Add to Queue",
      onClick: addToQueue,
      icon: ({ className }) => <ListOrdered className={className} />,
    },
    {
      label: "Add To Playlist",
      onClick: addToPlaylist,
      hide: true,
      icon: ({ className }) => <ListMusic className={className} />,
    },
    {
      label: "Play Radio",
      onClick: playRadio,
      hide: true,
      icon: ({ className }) => <Radio className={className} />,
    },
  ];

  return (
    <>
      {/* sheet for small devices */}
      <Sheet>
        <SheetTrigger>
          <MoreVertical className="hover:text-primary size-6 lg:hidden" />
        </SheetTrigger>

        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader>
            <div className="flex gap-2">
              <div className="relative aspect-square h-14 rounded-md">
                <Image
                  src={getImageSrc(item.image, "low")}
                  alt={item.name}
                  fill
                  className="z-10 rounded-md"
                />

                <Skeleton className="absolute inset-0 size-full" />
              </div>

              <div className="flex flex-col truncate text-start">
                <SheetTitle className="truncate">{item.name}</SheetTitle>

                <SheetDescription className="truncate">
                  {item.subtitle}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <Separator className="my-4" />

          <div
            className="relative flex flex-col gap-4 transition-transform duration-300"
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
                  {item.type === "song" ?
                    label
                  : label.replace("Song", "Episode")}
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

            <div className="bg-background absolute inset-y-0 left-[110%] flex min-w-full flex-col gap-4">
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

            <Separator />

            <TileMoreLinks
              type={item.type}
              itemUrl={item.url}
              albumUrl={"album_url" in item ? item.album_url : undefined}
              showAlbum={item.type === "song" ? showAlbum : false}
              primaryArtists={
                "artists" in item ?
                  item.artists
                : item.artist_map.primary_artists
              }
            />
          </div>

          <Separator className="my-4" />

          <SheetFooter className="sm:justify-center">
            <SheetClose>Cancel</SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* dropdown for large devices */}
      <DropdownMenu>
        <DropdownMenuTrigger>
          <MoreVertical className="hover:text-primary hidden size-6 lg:block" />
        </DropdownMenuTrigger>

        <DropdownMenuContent className="p-2">
          <DropdownMenuGroup>
            {menuItems
              .filter(({ hide }) => !hide)
              .map(({ icon: Icon, label, onClick }, i) => (
                <DropdownMenuItem key={i} onClick={onClick}>
                  <Icon className="mr-2 size-5" />
                  {item.type === "song" ?
                    label
                  : label.replace("Song", "Episode")}
                </DropdownMenuItem>
              ))}

            <ShareSubMenu />

            <Separator className="my-2" />

            <TileMoreLinks
              type={item.type}
              itemUrl={item.url}
              albumUrl={"album_url" in item ? item.album_url : undefined}
              showAlbum={showAlbum}
              isDropdownItem
              primaryArtists={
                "artists" in item ?
                  item.artists
                : item.artist_map.primary_artists
              }
            />
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
