import type { Queue } from "@infinitunes/types";
import { Platform, View } from "react-native";
import ReorderableList from "react-native-reorderable-list";

import { DragHandle } from "~/components/drag-handle";
import { EmptyState } from "~/components/empty-state";
import { MenuTrigger } from "~/components/menu-trigger";
import { addToPlaylistEntry, NativeMenu } from "~/components/native-menu";
import { SongRow } from "~/components/song-row";
import { IconButton } from "~/components/ui/icon-button";
import { Text } from "~/components/ui/text";
import { useSheetBottomInset } from "~/navigation/sheet-inset";
import { playerStore, usePlayer } from "~/playback/player-store";
import { addSongsToPlaylist, useUserPlaylists } from "~/user-data/playlists";
import { useUserId } from "~/user-data/session";

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
          onAdd: (playlist) => addSongsToPlaylist(playlist, songs),
        }),
      ]}
    >
      <MenuTrigger label="Queue actions" />
    </NativeMenu>
  );
}

/**
 * The queue sheet, as the web's queue pane: what is playing, then Up next
 * (drag a handle to reorder, a row's menu to remove it, the clear button to empty it),
 * and a menu that saves the queue to a playlist.
 */
export function QueueList() {
  const queue = usePlayer((state) => state.queue);
  const currentIndex = usePlayer((state) => state.currentIndex);
  const { playAt, removeAt, clearUpNext, moveInQueue } = playerStore.getState();
  const bottomInset = useSheetBottomInset();

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

  const current = queue[currentIndex];
  const firstNext = currentIndex + 1;
  const upNext = queue.slice(firstNext);

  const header = (
    <View className="gap-1 pt-2">
      {current ? (
        <>
          <View className="flex-row items-center justify-between px-page">
            <SectionLabel>Now playing</SectionLabel>
            <SaveQueueMenu queue={queue} />
          </View>
          <SongRow
            song={current}
            queueItemId={current.queueItemId}
            onPress={() => playAt(currentIndex)}
          />
        </>
      ) : null}
      <View className="min-h-touch flex-row items-center justify-between pl-page pr-1">
        <SectionLabel>{`Up next · ${upNext.length}`}</SectionLabel>
        {upNext.length > 0 ? (
          <IconButton
            icon={{ ios: "trash", android: "clear_all" }}
            label="Clear up next"
            size="md"
            onPress={clearUpNext}
          />
        ) : null}
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
        <View className="flex-row items-center pr-2">
          <View className="flex-1">
            <SongRow
              song={item}
              queueItemId={item.queueItemId}
              onPress={() => playAt(firstNext + index)}
              removal={{
                title: "Remove from Queue",
                onRemove: () => {
                  removeAt(firstNext + index);
                },
              }}
            />
          </View>
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
        </View>
      )}
      ListHeaderComponent={header}
      ListEmptyComponent={
        <Text tone="muted" className="px-page py-4">
          Nothing else is queued.
        </Text>
      }
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingBottom: bottomInset }}
    />
  );
}
