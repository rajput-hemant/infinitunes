import { decode, toCardItem } from "@infinitunes/types";
import type { ArtistMini, CardItem } from "@infinitunes/types";

type RawCardItem = Parameters<typeof toCardItem>[0];

/** `select` for a catalog list that feeds a shelf. */
export function cardItemsOf(items: readonly RawCardItem[]): CardItem[] {
  return items.map(toCardItem);
}

/** Artists carry `name`, not `title`, so `toCardItem` does not fit them. */
export function artistCards(artists: readonly ArtistMini[]): CardItem[] {
  return artists.map((artist) => ({
    id: artist.id,
    name: decode(artist.name),
    url: artist.perma_url,
    type: artist.type,
    image: artist.image,
  }));
}
