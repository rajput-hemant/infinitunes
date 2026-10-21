import type { Artist, CardItem, SimilarArtist } from "@infinitunes/types";
import { toArtistCard, toCardItem } from "@infinitunes/types";
import type { ReactNode } from "react";

import { Shelf } from "~/components/shelf";

/** `SimilarArtist` carries its artwork as `image_url`. */
function similarArtistCard(artist: SimilarArtist): CardItem {
  return toArtistCard({ ...artist, image: artist.image_url });
}

/**
 * The Overview's shelves under the top songs, in the web's order. The top
 * songs themselves are the playable rows above, so they get no shelf.
 */
export function OverviewShelves({ artist }: { artist: Artist }): ReactNode {
  const { modules } = artist;

  return (
    <>
      <Shelf
        title={modules.dedicated_artist_playlist?.title ?? "Playlists"}
        items={(artist.dedicated_artist_playlist ?? []).map(toCardItem)}
      />
      <Shelf
        title={modules.featured_artist_playlist?.title ?? "Playlists"}
        items={(artist.featured_artist_playlist ?? []).map(toCardItem)}
      />
      <Shelf
        title={modules.topAlbums?.title ?? "Albums"}
        items={(artist.topAlbums ?? []).map(toCardItem)}
      />
      <Shelf
        title={modules.singles?.title ?? "Singles"}
        items={(artist.singles ?? []).map(toCardItem)}
      />
      <Shelf
        title={modules.latest_release?.title ?? "Latest Release"}
        items={(artist.latest_release ?? []).map(toCardItem)}
      />
      <Shelf
        title={modules.similarArtists?.title ?? "Similar Artists"}
        items={(artist.similarArtists ?? []).map(similarArtistCard)}
      />
    </>
  );
}
