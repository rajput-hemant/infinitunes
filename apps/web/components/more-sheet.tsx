"use client";

import type { MediaType, Quality } from "@infinitunes/types";
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
import { ShareOptions } from "~/components/share-options";
import type { TileMoreEntry } from "~/components/song-list/more-button-item";
import { controlStyles } from "~/lib/control-styles";
import { cn } from "~/lib/utils";

const rowStyles = "flex h-(--ctl-lg) w-full shrink-0 items-center font-medium";

type MoreSheetProps = {
  /** The artwork shown beside the title, and the kind that picks its fallback. */
  art: { image: Quality; type: MediaType };
  title: string;
  subtitle: string;
  entries: TileMoreEntry[];
  /** Site path the Share panel shares; defaults to the current page. */
  sharePath?: string;
  /** Extra rows under Share (the row menu's artist, album and song links). */
  children?: React.ReactNode;
  /** The trigger's `data-deferred` name, so focus can follow the swap. */
  name?: string;
  /** The shell was clicked before this chunk arrived: open at once. */
  defaultOpen?: boolean;
  triggerClassName: string;
};

/**
 * The phone "more" bottom sheet shared by song rows and details headers:
 * entries, a Share panel and Cancel. Every entry is a `DrawerClose`, so
 * choosing one closes the sheet before whatever it opens (a dialog) appears.
 */
export function MoreSheet(props: MoreSheetProps) {
  const {
    art,
    title,
    subtitle,
    entries,
    sharePath,
    children,
    name,
    defaultOpen,
    triggerClassName,
  } = props;

  const [isSharing, setIsSharing] = React.useState(false);

  return (
    <Drawer
      defaultOpen={defaultOpen}
      onOpenChange={(open) => !open && setIsSharing(false)}
    >
      <DrawerTrigger
        aria-label="More options"
        data-deferred={name}
        className={triggerClassName}
      >
        <MoreVertical aria-hidden="true" className="size-5" />
      </DrawerTrigger>

      <DrawerContent className="rounded-t-2xl">
        <DrawerHeader className="pb-0">
          <div className="flex items-center gap-2 truncate">
            <div className="relative aspect-square h-14 rounded-md">
              <ImageWithFallback
                src={getImageSrc(art.image, "low")}
                alt={title}
                fill
                sizes="56px"
                fallback={getPlaceholderSrc(art.type)}
                className="z-10 shrink-0 rounded-md"
              />

              <Skeleton className="absolute inset-0 size-full" />
            </div>

            <div className="flex flex-col justify-start truncate text-start">
              <DrawerTitle className="truncate">{title}</DrawerTitle>
              <DrawerDescription className="truncate">
                {subtitle}
              </DrawerDescription>
            </div>
          </div>
        </DrawerHeader>

        <Separator className="mb-2 mt-4" />

        <div className="scrollbar-hover min-h-0 overflow-x-hidden overflow-y-auto">
          <div
            className="relative flex flex-col gap-2 px-4 transition-transform duration-300"
            style={{ transform: `translateX(${isSharing ? -110 : 0}%)` }}
          >
            <div
              inert={isSharing}
              aria-hidden={isSharing}
              className="flex flex-col gap-2"
            >
              {entries.map(({ icon: Icon, label, onClick, disabled }) => (
                <DrawerClose
                  key={label}
                  onClick={onClick}
                  disabled={disabled}
                  aria-busy={disabled || undefined}
                  className={cn(rowStyles, "disabled:opacity-50")}
                >
                  <Icon className="mr-2 size-5" />
                  {label}
                </DrawerClose>
              ))}

              <button
                type="button"
                onClick={() => setIsSharing(true)}
                className={rowStyles}
              >
                <Share2 className="mr-2 size-5" />
                Share
                <ChevronRight className="ml-auto size-5" />
              </button>

              {children && (
                <>
                  <Separator />
                  {children}
                </>
              )}
            </div>

            <div
              inert={!isSharing}
              aria-hidden={!isSharing}
              className="absolute left-[110%] min-w-full space-y-2 bg-background"
            >
              <button
                type="button"
                onClick={() => setIsSharing(false)}
                className={rowStyles}
              >
                <ChevronLeft className="mr-2 size-5" />
                Back
              </button>

              <Separator className="-my-2 mb-2" />

              <ShareOptions
                className="flex flex-col p-4 [&_a]:flex [&_a]:min-h-(--ctl-lg) [&_a]:items-center [&_button]:flex [&_button]:min-h-(--ctl-lg) [&_button]:items-center"
                title={title}
                path={sharePath}
              />
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        <DrawerFooter className="pt-0 sm:justify-center">
          <DrawerClose
            className={buttonVariants({
              variant: "outline",
              className: cn(controlStyles.text, "w-full"),
            })}
          >
            Cancel
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
