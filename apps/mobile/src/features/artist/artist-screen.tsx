import { decode } from "@infinitunes/types";

import { DetailFrame } from "~/components/detail/detail-frame";

import { ArtistContent } from "./artist-content";
import { artistShareUrl } from "./artist-share-url";
import { ArtistSkeleton } from "./artist-skeleton";
import { useArtist } from "./use-artist";

/** The artist behind a route token: loading, not found, failed, or the artist. */
export function ArtistScreen({ token }: { token: string }) {
  const query = useArtist(token);

  return (
    <DetailFrame
      query={query}
      skeleton={<ArtistSkeleton />}
      noun="Artist"
      icon={{ ios: "music.microphone", android: "artist" }}
      identity={(artist) => ({
        name: decode(artist.name),
        url: artistShareUrl(artist),
      })}
    >
      {(artist) => (
        <ArtistContent
          artist={artist}
          onRefresh={query.refetch}
          isRefreshing={query.isRefetching}
        />
      )}
    </DetailFrame>
  );
}
