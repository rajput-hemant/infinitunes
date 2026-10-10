import type { Episode, Queue, Song } from "@infinitunes/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@infinitunes/ui/components/dropdown-menu";
import { MoreVertical } from "lucide-react";

import { getItemName } from "~/components/song-list/item-name";
import { controlStyles } from "~/lib/control-styles";
import { cn } from "~/lib/utils";

import { ShareSubMenu } from "../share-submenu";
import {
  getEntryLabel,
  getItemAlbumUrl,
  getItemArtists,
  getItemUrl,
  type TileMoreEntry,
} from "./more-button-item";
import { TileMoreLinks } from "./more-links";

type TileMoreDesktopProps = {
  item: Song | Episode | Queue;
  showAlbum: boolean;
  entries: TileMoreEntry[];
  className?: string;
};

export function TileMoreDesktop(props: TileMoreDesktopProps) {
  const { item, showAlbum, entries, className } = props;

  return (
    <div className="hidden md:block">
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="More Options"
          className={cn(
            controlStyles.rowIcon,
            "inline-flex items-center justify-center outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
            className,
          )}
        >
          <MoreVertical aria-hidden="true" className="size-5" />
        </DropdownMenuTrigger>

        <DropdownMenuContent
          side="left"
          align="start"
          className="*:cursor-pointer"
        >
          {entries.map(({ icon: Icon, label, onClick }) => (
            <DropdownMenuItem key={label} onClick={onClick}>
              <Icon className="mr-2 size-5" />
              {getEntryLabel(item, label)}
            </DropdownMenuItem>
          ))}
          <ShareSubMenu title={getItemName(item)} />
          <DropdownMenuSeparator className="my-2" />
          <TileMoreLinks
            type={item.type}
            itemUrl={getItemUrl(item)}
            albumUrl={getItemAlbumUrl(item)}
            showAlbum={showAlbum}
            isDropdownItem
            primaryArtists={getItemArtists(item)}
          />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
