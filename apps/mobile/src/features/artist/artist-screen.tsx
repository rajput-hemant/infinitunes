import { decode } from "@infinitunes/types";
import { Stack } from "expo-router";

import { ArtistContent } from "./artist-content";
import { artistShareUrl } from "./artist-share-url";
import { ArtistSkeleton } from "./artist-skeleton";
import { DetailFailure } from "./detail-failure";
import { detailHeaderOptions } from "./detail-header-options";
import { useArtist } from "./use-artist";

/** The artist behind a route token: loading, not found, failed, or the artist. */
export function ArtistScreen({ token }: { token: string }) {
  const {
    data: artist,
    error,
    isPending,
    isRefetching,
    refetch,
  } = useArtist(token);

  if (artist) {
    return (
      <>
        <Stack.Screen
          options={detailHeaderOptions({
            name: decode(artist.name),
            url: artistShareUrl(artist),
          })}
        />
        <ArtistContent
          artist={artist}
          onRefresh={refetch}
          isRefreshing={isRefetching}
        />
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={detailHeaderOptions()} />
      {isPending ? (
        <ArtistSkeleton />
      ) : (
        <DetailFailure
          noun="Artist"
          icon={{ ios: "music.microphone", android: "artist" }}
          error={error}
          onRetry={() => void refetch()}
        />
      )}
    </>
  );
}
