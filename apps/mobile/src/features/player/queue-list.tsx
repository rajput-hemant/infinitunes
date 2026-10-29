import type { Queue } from "@infinitunes/types";
import { memo } from "react";
import { Platform, useWindowDimensions, View } from "react-native";
import ReorderableList from "react-native-reorderable-list";

import { DragHandle } from "~/components/drag-handle";
import { EmptyState } from "~/components/empty-state";
import { MenuTrigger } from "~/components/menu-trigger";
import { addToPlaylistEntry, NativeMenu } from "~/components/native-menu";
import { IconButton } from "~/components/ui/icon-button";
import { Text } from "~/components/ui/text";
import { playerStore, usePlayer } from "~/playback/player-store";
import {
  addSongsToPlaylist,
  usePlaylistMembership,
  useUserPlaylists,
} from "~/user-data/playlists";
import { useUserId } from "~/user-data/session";

import { QueueRow } from "./queue-row";

/** Android labels the groups as Material 3 does Settings' (labelLarge in primary). */
const android = () => Platform.OS === "android";

function SectionLabel({ children }: { children: string }) {
  return (
    <Text
      variant={android() ? "label" : "subhead"}
      tone={android() ? "primary" : "muted"}
      emphasized
      accessibilityRole="header"
    >
      {children}
    </Text>
  );
}

/** "Add to Playlist" for every song in the queue, as one write. */
function SaveQueueMenu({ queue }: { queue: readonly Queue[] }) {
  const signedIn = useUserId() !== undefined;
  const playlists = useUserPlaylists();
  const membership = usePlaylistMembership();
  const songs = queue.filter((entry) => entry.type === "song");
  // Playlists need an account: no menu at all while signed out.
  if (!signedIn || songs.length === 0) return null;

  return (
    <NativeMenu
      title="Queue"
      entries={[
        addToPlaylistEntry({
          songs,
          playlists,
          membership,
          onAdd: (playlist) => addSongsToPlaylist(playlist, songs),
        }),
      ]}
    >
      <MenuTrigger label="Queue actions" />
    </NativeMenu>
  );
}

/**
 * Now Playing's queue mode, as the web's queue pane: Up next under the
 * player's compact header (drag a handle to reorder, a row's menu to remove
 * it, the clear button to empty it), and a menu that saves the queue to a
 * playlist. The player's scrubber and transport stay below it.
 */
export const QueueList = memo(function QueueList() {
  // The player and its queue span the window, including in split view and rotation.
  const { width } = useWindowDimensions();
  const queue = usePlayer((state) => state.queue);
  const currentIndex = usePlayer((state) => state.currentIndex);
  const { playAt, removeAt, clearUpNext, moveInQueue } = playerStore.getState();

  if (queue.length === 0) {
    return (
      <EmptyState
        icon={{ ios: "list.bullet", android: "queue_music" }}
        title="Nothing queued"
        message="Songs you play or add to the queue show up here."
        placement="top"
      />
    );
  }

  const firstNext = currentIndex + 1;
  const upNext = queue.slice(firstNext);

  const header = (
    <View className="min-h-touch flex-row items-center justify-between pl-page pr-1">
      <SectionLabel>{`Up next · ${upNext.length}`}</SectionLabel>
      <View className="flex-row items-center">
        {upNext.length > 0 ? (
          <IconButton
            icon={{ ios: "trash", android: "clear_all" }}
            label="Clear up next"
            size="md"
            onPress={clearUpNext}
          />
        ) : null}
        <SaveQueueMenu queue={queue} />
      </View>
    </View>
  );

  return (
    <ReorderableList
      data={upNext}
      keyExtractor={(entry) => entry.queueItemId}
      onReorder={({ from, to }) =>
        moveInQueue(firstNext + from, firstNext + to)
      }
      renderItem={({ item, index }) => (
        <QueueRow
          song={item}
          width={width}
          onPress={() => playAt(firstNext + index)}
          onRemove={() => {
            removeAt(firstNext + index);
          }}
        >
          <DragHandle
            name={item.name}
            actions={{
              moveUp:
                index > 0
                  ? () => moveInQueue(firstNext + index, firstNext + index - 1)
                  : undefined,
              moveDown:
                index < upNext.length - 1
                  ? () => moveInQueue(firstNext + index, firstNext + index + 1)
                  : undefined,
            }}
          />
        </QueueRow>
      )}
      ListHeaderComponent={header}
      ListEmptyComponent={
        <Text tone="muted" className="px-page py-4">
          Nothing else is queued.
        </Text>
      }
    />
  );
});
