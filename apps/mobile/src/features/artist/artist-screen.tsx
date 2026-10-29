import type { ArtistTab } from "@infinitunes/core/entity-route";
import { decode } from "@infinitunes/types";

import { DetailFrame } from "~/components/detail/detail-frame";

import { ArtistContent } from "./artist-content";
import { artistShareUrl } from "./artist-share-url";
import { ArtistSkeleton } from "./artist-skeleton";
import { useArtist } from "./use-artist";

type ArtistScreenProps = {
  token: string;
  /** The tab to open on (the route's tab segment). */
  initialTab: ArtistTab;
};

/** The artist behind a route token: loading, not found, failed, or the artist. */
export function ArtistScreen({ token, initialTab }: ArtistScreenProps) {
  const query = useArtist(token);

  return (
    <DetailFrame
      query={query}
      skeleton={<ArtistSkeleton tab={initialTab} />}
      noun="Artist"
      icon={{ ios: "music.microphone", android: "artist" }}
      identity={(artist) => ({
        name: decode(artist.name),
        type: "artist",
        url: artistShareUrl(artist),
      })}
    >
      {(artist) => (
        <ArtistContent
          artist={artist}
          onRefresh={query.refetch}
          initialTab={initialTab}
        />
      )}
    </DetailFrame>
  );
}
