import {
  artistCards,
  decode,
  isExplicit,
  toCardItems,
} from "@infinitunes/types";
import type { CardItem, Playlist } from "@infinitunes/types";
import { useQuery } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";
import { useMemo } from "react";

import { CollectionMenu } from "~/components/collection-menu";
import { DetailScreen } from "~/components/detail/detail-screen";
import { DetailSkeleton } from "~/components/detail/detail-skeleton";
import { EntityHeader } from "~/components/entity-header";
import { SecondaryShelf } from "~/components/secondary-shelf";
import { Shelf } from "~/components/shelf";
import { TrackList } from "~/components/track-list";
import { entityQueries } from "~/lib/entity-queries";
import { joinMeta } from "~/lib/meta";
import { songRowsOf } from "~/lib/song-rows";
import { trpc } from "~/lib/trpc";
import { playAll, shuffleAll } from "~/playback/play-collection";

type PlaylistScreenProps = {
  token: string;
};

function playlistMeta(playlist: Playlist): string {
  // Upstream lists the facts newest first; the web header reverses them.
  return joinMeta(playlist.more_info.subtitle_desc.toReversed());
}

/** The credit line, unless it only repeats a fact the meta line already has ("122.2K Fans"). */
function playlistCredit(playlist: Playlist): string | undefined {
  const credit = decode(playlist.subtitle);
  return /\bfans$/i.test(credit) ? undefined : credit || undefined;
}

/** A catalog playlist, not one of the listener's own (those are in the library). */
export function PlaylistScreen({ token }: PlaylistScreenProps) {
  const query = useQuery(entityQueries.playlist(token));
  // Independent of the playlist: starts with it instead of after it.
  const trending = useQuery({
    ...trpc.get.trending.queryOptions({ type: "playlist" }),
    select: toCardItems,
  });

  return (
    <DetailScreen
      query={query}
      skeleton={<DetailSkeleton />}
      noun="Playlist"
      icon={{ ios: "music.note.list", android: "queue_music" }}
      refreshKeys={[
        trpc.playlist.recommendations.pathKey(),
        trpc.get.trending.pathKey(),
      ]}
      identity={(playlist) => ({
        name: decode(playlist.title),
        type: "playlist",
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
        eyebrow="Playlist"
        title={decode(playlist.title)}
        subtitle={playlistCredit(playlist)}
        meta={playlistMeta(playlist)}
        explicit={isExplicit(playlist.explicit_content)}
        onPlay={() => playAll(rows)}
        onShuffle={() => shuffleAll(rows)}
        like={{ type: "playlist", token: playlist.id }}
        actions={<CollectionMenu name={decode(playlist.title)} rows={rows} />}
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
