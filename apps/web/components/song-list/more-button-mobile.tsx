"use client";

import type { Episode, Queue, Song } from "@infinitunes/types";
import { getImageSrc } from "@infinitunes/types";
import { buttonVariants } from "@infinitunes/ui/components/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@infinitunes/ui/components/drawer";
import { Separator } from "@infinitunes/ui/components/separator";
import { Skeleton } from "@infinitunes/ui/components/skeleton";
import { ChevronLeft, ChevronRight, MoreVertical, Share2 } from "lucide-react";
import React from "react";

import { ImageWithFallback } from "~/components/image-with-fallback";
import { getPlaceholderSrc } from "~/components/placeholder-src";
import { getItemName } from "~/components/song-list/item-name";
import { controlStyles } from "~/lib/control-styles";
import { cn } from "~/lib/utils";

import { ShareOptions } from "../share-options";
import {
  getItemAlbumUrl,
  getItemArtists,
  getItemUrl,
  type TileMoreEntry,
} from "./more-button-item";
import { TileMoreLinks } from "./more-links";

type TileMoreMobileProps = {
  item: Song | Episode | Queue;
  showAlbum: boolean;
  entries: TileMoreEntry[];
  className?: string;
};

export function TileMoreMobile(props: TileMoreMobileProps) {
  const { item, showAlbum, entries, className } = props;

  const [isSharing, setIsSharing] = React.useState(false);

  return (
    <div className="md:hidden">
      <Drawer onOpenChange={(open) => !open && setIsSharing(false)}>
        <DrawerTrigger
          aria-label="More Options"
          className={cn(
            controlStyles.rowIcon,
            "flex items-center justify-center outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
            className,
          )}
        >
          <MoreVertical aria-hidden="true" className="size-5" />
        </DrawerTrigger>

        <DrawerContent className="rounded-t-2xl">
          <DrawerHeader className="pb-0">
            <div className="flex items-center gap-2 truncate">
              <div className="relative aspect-square h-14 rounded-md">
                <ImageWithFallback
                  src={getImageSrc(item.image, "low")}
                  alt={getItemName(item)}
                  fill
                  sizes="56px"
                  fallback={getPlaceholderSrc("song")}
                  className="z-10 shrink-0 rounded-md"
                />

                <Skeleton className="absolute inset-0 size-full" />
              </div>

              <div className="flex flex-col justify-start truncate text-start">
                <DrawerTitle className="truncate">
                  {getItemName(item)}
                </DrawerTitle>
                <DrawerDescription className="truncate">
                  {item.subtitle}
                </DrawerDescription>
              </div>
            </div>
          </DrawerHeader>

          <Separator className="mb-2 mt-4" />

          <div className="min-h-0 overflow-x-hidden overflow-y-auto">
            <div
              className="relative flex flex-col gap-2 px-4 transition-transform duration-300"
              style={{ transform: `translateX(${isSharing ? -110 : 0}%)` }}
            >
              <div
                inert={isSharing}
                aria-hidden={isSharing}
                className="flex flex-col gap-2"
              >
                {entries.map(({ icon: Icon, label, onClick }) => (
                  <button
                    key={label}
                    onClick={onClick}
                    className="flex h-(--ctl-lg) shrink-0 items-center font-medium"
                  >
                    <Icon className="mr-2 size-5" />
                    {label}
                  </button>
                ))}

                <button
                  onClick={() => setIsSharing(true)}
                  className="flex h-(--ctl-lg) shrink-0 items-center font-medium"
                >
                  <Share2 className="mr-2 size-5" />
                  Share
                  <ChevronRight className="ml-auto size-5" />
                </button>

                <Separator />

                <TileMoreLinks
                  type={item.type}
                  itemUrl={getItemUrl(item)}
                  albumUrl={getItemAlbumUrl(item)}
                  showAlbum={item.type === "song" ? showAlbum : false}
                  primaryArtists={getItemArtists(item)}
                />
              </div>

              <div
                inert={!isSharing}
                aria-hidden={!isSharing}
                className="absolute left-[110%] min-w-full space-y-2 bg-background"
              >
                <button
                  onClick={() => setIsSharing(false)}
                  className="flex h-(--ctl-lg) shrink-0 items-center font-medium"
                >
                  <ChevronLeft className="mr-2 size-5" />
                  Back
                </button>

                <Separator className="-my-2 mb-2" />

                <ShareOptions
                  className="flex flex-col p-4 [&_a]:flex [&_a]:min-h-(--ctl-lg) [&_a]:items-center [&_button]:flex [&_button]:min-h-(--ctl-lg) [&_button]:items-center"
                  title={getItemName(item)}
                />
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          <DrawerFooter className="pt-0 sm:justify-center">
            <DrawerClose
              className={buttonVariants({ className: controlStyles.text })}
            >
              Cancel
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
