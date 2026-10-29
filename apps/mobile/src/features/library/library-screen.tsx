import { usePlaylists } from "@infinitunes/core/react/optimistic-playlists";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { View } from "react-native";
import Animated from "react-native-reanimated";

import { EmptyState } from "~/components/empty-state";
import { ErrorState } from "~/components/error-state";
import { ListRow } from "~/components/list-row";
import { PageTitle } from "~/components/page-title";
import { SectionHeader } from "~/components/section-header";
import { CONTENT_REVEAL, SongListSkeleton } from "~/components/skeletons";
import { PullToRefresh } from "~/components/ui/refresh-control";
import { GRID_GAP, useGridCardWidth } from "~/lib/use-grid-card-width";
import { playerDockInset } from "~/navigation/player-dock";
import { useScrolledBar } from "~/navigation/use-scrolled-bar";
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
import { useHistory } from "./use-history";
import { usePlaylistCovers } from "./use-playlist-covers";

/** Liked Songs and Recently Played, side by side across the row at any width; the counts are already loaded. */
function Tiles() {
  const width = useGridCardWidth(2);
  const liked = useFavoriteLists()?.songs.length;
  const history = useHistory();
  const played = history.status === "ready" ? history.items.length : undefined;
  return (
    <View className="flex-row px-page pb-2 pt-2" style={{ gap: GRID_GAP }}>
      <LibraryTile
        {...LIKED_SONGS}
        width={width}
        detail={liked === undefined ? undefined : songCount(liked)}
      />
      <LibraryTile
        {...RECENTLY_PLAYED}
        width={width}
        detail={played === undefined ? undefined : songCount(played)}
      />
    </View>
  );
}

function Library() {
  const { data, error, isPending, refetch } = useServerPlaylists();
  const playlists = usePlaylists(data);
  const covers = usePlaylistCovers(playlists);
  const scrolledBar = useScrolledBar();

  return (
    <FlashList
      data={isPending ? [] : (playlists ?? [])}
      keyExtractor={(playlist) => playlist.id}
      renderItem={({ item }) => (
        <PlaylistRow
          playlist={item}
          cover={item.coverSongs[0] && covers.get(item.coverSongs[0])}
        />
      )}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingBottom: playerDockInset }}
      refreshControl={<PullToRefresh onRefresh={refetch} />}
      {...scrolledBar}
      ListHeaderComponent={
        <>
          <PageTitle title="Library" />
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
          {isPending ? (
            <SongListSkeleton rows={3} />
          ) : (
            <Animated.View entering={CONTENT_REVEAL} testID="playlists-reveal">
              {!playlists ? (
                <ErrorState error={error} onRetry={() => void refetch()} />
              ) : playlists.length === 0 ? (
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
              ) : null}
            </Animated.View>
          )}
        </>
      }
    />
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
