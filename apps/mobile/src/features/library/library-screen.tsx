import { usePlaylists } from "@infinitunes/core/react/optimistic-playlists";
import { router } from "expo-router";
import { View } from "react-native";

import { EmptyState } from "~/components/empty-state";
import { ErrorState } from "~/components/error-state";
import { ListRow } from "~/components/list-row";
import { ScreenScrollView } from "~/components/screen-scroll-view";
import { SectionHeader } from "~/components/section-header";
import { SongListSkeleton } from "~/components/skeletons";
import { PullToRefresh } from "~/components/ui/refresh-control";
import { GRID_GAP, useGridCardWidth } from "~/lib/use-grid-card-width";
import { useFavoriteLists } from "~/user-data/favorites";
import { useServerPlaylists } from "~/user-data/playlists";

import {
  LIBRARY_SHORTCUTS,
  LIKED_SONGS,
  RECENTLY_PLAYED,
} from "./library-shortcuts";
import { LibraryTile } from "./library-tile";
import { PlaylistRow, songCount } from "./playlist-row";
import { SignedInGate } from "./signed-in-gate";
import { usePlaylistCovers } from "./use-playlist-covers";

function Playlists() {
  const { data, error, isPending, refetch } = useServerPlaylists();
  const playlists = usePlaylists(data);
  const covers = usePlaylistCovers(playlists);

  if (isPending) return <SongListSkeleton rows={3} />;
  if (!playlists) {
    return <ErrorState error={error} onRetry={() => void refetch()} />;
  }
  if (playlists.length === 0) {
    return (
      <EmptyState
        placement="top"
        icon={{ ios: "music.note.list", android: "queue_music" }}
        title="No playlists yet"
        message="Collect songs you love into playlists you can play any time."
        action={{
          label: "New Playlist",
          onPress: () => router.push("/create-playlist"),
        }}
      />
    );
  }
  return playlists.map((playlist) => (
    <PlaylistRow
      key={playlist.id}
      playlist={playlist}
      cover={playlist.coverSongs[0] && covers.get(playlist.coverSongs[0])}
    />
  ));
}

/** Liked Songs and Recently Played, side by side across the row at any width; the liked count is already loaded. */
function Tiles() {
  const width = useGridCardWidth(2);
  const liked = useFavoriteLists()?.songs.length;
  return (
    <View className="flex-row px-page pb-2 pt-2" style={{ gap: GRID_GAP }}>
      <LibraryTile
        {...LIKED_SONGS}
        width={width}
        detail={liked === undefined ? undefined : songCount(liked)}
      />
      <LibraryTile {...RECENTLY_PLAYED} width={width} />
    </View>
  );
}

function Library() {
  const { refetch } = useServerPlaylists();

  return (
    <ScreenScrollView refreshControl={<PullToRefresh onRefresh={refetch} />}>
      <Tiles />
      {LIBRARY_SHORTCUTS.map(({ title, icon, href }) => (
        <ListRow
          key={title}
          leading={{ icon }}
          title={title}
          href={href}
          chevron
        />
      ))}
      <SectionHeader
        title="Playlists"
        action={{
          label: "New",
          href: "/create-playlist",
          accessibilityLabel: "New Playlist",
        }}
      />
      <Playlists />
    </ScreenScrollView>
  );
}

/** The Library tab: the listener's saved lists and playlists, or a way to sign in. */
export function LibraryScreen() {
  return (
    <SignedInGate>
      <Library />
    </SignedInGate>
  );
}
