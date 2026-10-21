import type { PlaylistView } from "@infinitunes/core/react/optimistic-playlists";
import { usePlaylists } from "@infinitunes/core/react/optimistic-playlists";
import { formatDuration } from "@infinitunes/types";
import type { SongRowItem } from "@infinitunes/types";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { View } from "react-native";

import { EmptyState } from "~/components/empty-state";
import { ErrorState } from "~/components/error-state";
import { SongListSkeleton } from "~/components/skeletons";
import { SongRow } from "~/components/song-row";
import { Icon } from "~/components/ui/icon";
import { Text } from "~/components/ui/text";
import { removeSongFromPlaylist } from "~/user-data/playlists";
import { useServerPlaylists } from "~/user-data/playlists";

import { LibraryListView } from "./library-list-view";
import { PlaylistMenu } from "./playlist-menu";
import { SignedInGate } from "./signed-in-gate";
import { SongCollection } from "./song-collection";
import { SwipeableRow } from "./swipeable-row";
import { usePlaylistSongs } from "./use-playlist-songs";

const totalSeconds = (songs: readonly SongRowItem[]) =>
  songs.reduce((total, song) => total + song.duration, 0);

type PlaylistSongRowProps = {
  song: SongRowItem;
  play: () => void;
  onRemove: () => void;
};

function PlaylistSongRow({ song, play, onRemove }: PlaylistSongRowProps) {
  return (
    <SwipeableRow
      action={{
        label: "Remove",
        icon: { ios: "minus.circle", android: "remove_circle" },
        onPress: onRemove,
      }}
    >
      <SongRow
        song={song}
        onPress={play}
        removal={{ title: "Remove from Playlist", onRemove }}
      />
    </SwipeableRow>
  );
}

function PlaylistSongs({ playlist }: { playlist: PlaylistView }) {
  const { data } = useServerPlaylists();
  const list = usePlaylistSongs(playlist);
  // Removal indexes against the server's copy, not the overlay's (see user-data).
  const server = data?.find(({ id }) => id === playlist.id) ?? playlist;

  return (
    <LibraryListView
      list={list}
      skeleton={<SongListSkeleton />}
      empty={{
        icon: { ios: "music.note.list", android: "queue_music" },
        title: "Nothing to see here",
        message:
          "Add songs to this playlist from any song's menu and they will show up here.",
      }}
    >
      {({ items, missing, refreshing, refresh }) => (
        <SongCollection
          songs={items}
          missing={missing}
          refreshing={refreshing}
          onRefresh={refresh}
          recentLabel="Playlist order"
          header={
            <View className="gap-1 px-page pb-3">
              {playlist.description ? (
                <Text tone="muted">{playlist.description}</Text>
              ) : null}
              <Text variant="subhead" tone="muted">
                {formatDuration(totalSeconds(items), "hh:mm:ss")} total
              </Text>
            </View>
          }
          renderRow={(song, play) => (
            <PlaylistSongRow
              song={song}
              play={play}
              onRemove={() => removeSongFromPlaylist(server, song)}
            />
          )}
        />
      )}
    </LibraryListView>
  );
}

function Playlist({ id }: { id: string }) {
  const { data, error, isPending, refetch } = useServerPlaylists();
  const playlists = usePlaylists(data);
  const playlist = playlists?.find((candidate) => candidate.id === id);

  if (isPending) return <SongListSkeleton />;
  if (!playlists) {
    return <ErrorState error={error} onRetry={() => void refetch()} />;
  }
  if (!playlist) {
    return (
      <EmptyState
        icon={{ ios: "music.note.list", android: "queue_music" }}
        title="Playlist not found"
        message="It may have been deleted."
        action={{ label: "Back to Library", onPress: () => router.back() }}
      />
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: playlist.name }} />
      <Stack.Toolbar placement="right" asChild>
        <PlaylistMenu playlist={playlist} onDeleting={() => router.back()}>
          <View
            accessibilityRole="button"
            accessibilityLabel="Playlist options"
            className="size-ctl items-center justify-center"
          >
            <Icon
              name={{ ios: "ellipsis.circle", android: "more_vert" }}
              size={22}
            />
          </View>
        </PlaylistMenu>
      </Stack.Toolbar>
      <PlaylistSongs playlist={playlist} />
    </>
  );
}

export function PlaylistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <SignedInGate>
      <Playlist id={id} />
    </SignedInGate>
  );
}
