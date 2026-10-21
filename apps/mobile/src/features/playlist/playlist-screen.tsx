import { artistCards, decode, toCardItems } from "@infinitunes/types";
import type { CardItem, Playlist } from "@infinitunes/types";
import { useQuery } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";
import { useMemo } from "react";

import { EntityHeader } from "~/components/entity-header";
import { Shelf } from "~/components/shelf";
import { DetailScreen } from "~/features/song/detail-screen";
import { DetailSkeleton } from "~/features/song/detail-skeleton";
import { joinMeta } from "~/features/song/meta";
import { playAll, shuffleAll } from "~/features/song/play-collection";
import { SecondaryShelf } from "~/features/song/secondary-shelf";
import { songRowsOf } from "~/features/song/song-rows";
import { TrackList } from "~/features/song/track-list";
import { trpc } from "~/lib/trpc";

type PlaylistScreenProps = {
  token: string;
};

function playlistMeta(playlist: Playlist): string {
  // Upstream lists the facts newest first; the web header reverses them.
  const facts = playlist.more_info.subtitle_desc.toReversed();
  return joinMeta([decode(playlist.subtitle), ...facts]);
}

/** A catalog playlist, not one of the listener's own (those are in the library). */
export function PlaylistScreen({ token }: PlaylistScreenProps) {
  const query = useQuery(trpc.playlist.details.queryOptions({ token }));
  // Independent of the playlist: starts with it instead of after it.
  const trending = useQuery({
    ...trpc.get.trending.queryOptions({ type: "playlist" }),
    select: toCardItems,
  });

  return (
    <DetailScreen
      query={query}
      skeleton={<DetailSkeleton />}
      noun="playlist"
      refreshKeys={[
        trpc.playlist.recommendations.pathKey(),
        trpc.get.trending.pathKey(),
      ]}
      identity={(playlist) => ({
        name: decode(playlist.title),
        url: playlist.perma_url,
      })}
    >
      {(playlist) => <PlaylistPage playlist={playlist} trending={trending} />}
    </DetailScreen>
  );
}

type PlaylistPageProps = {
  playlist: Playlist;
  trending: UseQueryResult<CardItem[], unknown>;
};

function PlaylistPage({ playlist, trending }: PlaylistPageProps) {
  const rows = useMemo(() => songRowsOf(playlist.list), [playlist]);
  const recommendations = useQuery({
    ...trpc.playlist.recommendations.queryOptions({ id: playlist.id }),
    select: toCardItems,
  });
  const { modules } = playlist;

  return (
    <>
      <EntityHeader
        image={playlist.image}
        title={decode(playlist.title)}
        subtitle={playlistMeta(playlist)}
        onPlay={() => playAll(rows)}
        onShuffle={() => shuffleAll(rows)}
        like={{ type: "playlist", token: playlist.id }}
      />
      <TrackList rows={rows} />
      <SecondaryShelf
        title={modules?.relatedPlaylist?.title ?? "Recommended Playlists"}
        query={recommendations}
      />
      <SecondaryShelf
        title={
          modules?.currentlyTrendingPlaylists?.title ?? "Trending Playlists"
        }
        query={trending}
      />
      <Shelf
        title={modules?.artists?.title ?? "Artists"}
        items={artistCards(playlist.more_info.artists ?? [])}
      />
    </>
  );
}
