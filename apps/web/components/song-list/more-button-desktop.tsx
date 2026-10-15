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
  getItemAlbumUrl,
  getItemArtists,
  getItemSharePath,
  getItemUrl,
  type TileMoreEntry,
  type TileMoreItem,
} from "./more-button-item";
import { TileMoreLinks } from "./more-links";

type TileMoreDesktopProps = {
  item: TileMoreItem;
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
          aria-label="More options"
          className={cn(
            controlStyles.rowIcon,
            "inline-flex items-center justify-center outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
            className,
          )}
        >
          <MoreVertical aria-hidden="true" className="size-5" />
        </DropdownMenuTrigger>

        {/* The primitive pins the popup to the trigger's width (`--anchor-width`,
            40px here) with an 8rem floor, so the labels wrap. Size it to the
            content instead, within 14rem to 20rem and the viewport. */}
        <DropdownMenuContent
          side="left"
          align="start"
          className="w-auto min-w-56 max-w-[min(20rem,calc(100vw-1rem))] *:cursor-pointer"
        >
          {entries.map(({ icon: Icon, label, onClick }) => (
            <DropdownMenuItem key={label} onClick={onClick}>
              <Icon className="mr-2 size-5" />
              <span className="min-w-0 truncate" title={label}>
                {label}
              </span>
            </DropdownMenuItem>
          ))}
          <ShareSubMenu
            title={getItemName(item)}
            path={getItemSharePath(item)}
          />
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
