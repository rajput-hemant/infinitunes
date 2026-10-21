import { decode, toCardItem, uniqueArtists } from "@infinitunes/types";
import type { ArtistMini, CardItem } from "@infinitunes/types";

type RawCardItem = Parameters<typeof toCardItem>[0];

/** `select` for a catalog list that feeds a shelf. */
export function cardItemsOf(items: readonly RawCardItem[]): CardItem[] {
  return items.map(toCardItem);
}

/**
 * Artists carry `name`, not `title`, so `toCardItem` does not fit them.
 * Upstream lists an artist once per role; a card shows each artist once.
 */
export function artistCards(artists: readonly ArtistMini[]): CardItem[] {
  return uniqueArtists([...artists]).map((artist) => ({
    id: artist.id,
    name: decode(artist.name),
    url: artist.perma_url,
    type: artist.type,
    image: artist.image,
  }));
}
