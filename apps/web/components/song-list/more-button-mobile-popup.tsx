"use client";

import { MoreSheet } from "~/components/more-sheet";
import { getItemName } from "~/components/song-list/item-name";

import {
  getItemAlbumUrl,
  getItemArtists,
  getItemSharePath,
  getItemUrl,
  type TileMoreEntry,
  type TileMoreItem,
} from "./more-button-item";
import { moreTriggerClassName } from "./more-button-trigger";
import { TileMoreLinks } from "./more-links";

type TileMoreMobilePopupProps = {
  /** The trigger's `data-deferred` name, so focus can follow the swap. */
  name?: string;
  /** The shell was clicked before this chunk arrived: open at once. */
  defaultOpen?: boolean;
  item: TileMoreItem;
  showAlbum: boolean;
  entries: TileMoreEntry[];
  className?: string;
};

/** The real bottom sheet, loaded on intent by `TileMoreMobile`. */
export function TileMoreMobilePopup(props: TileMoreMobilePopupProps) {
  const { item, showAlbum, entries, className, name, defaultOpen } = props;

  return (
    <div className="md:hidden">
      <MoreSheet
        art={{ image: item.image, type: item.type }}
        title={getItemName(item)}
        subtitle={item.subtitle}
        entries={entries}
        sharePath={getItemSharePath(item)}
        name={name}
        defaultOpen={defaultOpen}
        triggerClassName={moreTriggerClassName("flex", className)}
      >
        <TileMoreLinks
          type={item.type}
          itemUrl={getItemUrl(item)}
          albumUrl={getItemAlbumUrl(item)}
          showAlbum={item.type === "song" ? showAlbum : false}
          primaryArtists={getItemArtists(item)}
        />
      </MoreSheet>
    </div>
  );
}
