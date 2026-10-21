import type { Queue } from "@infinitunes/types";
import { Pressable, View } from "react-native";
import ReorderableList from "react-native-reorderable-list";
import { toast } from "sonner-native";

import { DragHandle } from "~/components/drag-handle";
import { EmptyState } from "~/components/empty-state";
import { MenuTrigger } from "~/components/menu-trigger";
import { addToPlaylistEntry, NativeMenu } from "~/components/native-menu";
import { SongRow } from "~/components/song-row";
import { TEXT_BUTTON_HIT_SLOP } from "~/components/ui/hit-slop";
import { Text } from "~/components/ui/text";
import { playerStore, usePlayer } from "~/playback/player-store";
import { addSongsToPlaylist, useUserPlaylists } from "~/user-data/playlists";
import { useUserId } from "~/user-data/session";

function SectionLabel({ children }: { children: string }) {
  return (
    <Text variant="subhead" tone="muted" accessibilityRole="header">
      {children}
    </Text>
  );
}

/** "Add to Playlist" for every song in the queue, as one write. */
function SaveQueueMenu({ queue }: { queue: readonly Queue[] }) {
  const signedIn = useUserId() !== undefined;
  const playlists = useUserPlaylists();
  const songs = queue.filter((entry) => entry.type === "song");
  if (songs.length === 0) return null;

  return (
    <NativeMenu
      title="Queue"
      entries={[
        addToPlaylistEntry({
          songs,
          signedIn,
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
 * (drag a handle to reorder, a row's menu to remove it, Clear to empty it),
 * and a menu that saves the queue to a playlist.
 */
export function QueueList() {
  const queue = usePlayer((state) => state.queue);
  const currentIndex = usePlayer((state) => state.currentIndex);
  const { playAt, removeAt, clearUpNext, moveInQueue } = playerStore.getState();

  if (queue.length === 0) {
    return (
      <EmptyState
        icon={{ ios: "list.bullet", android: "queue_music" }}
        title="Nothing queued"
        message="Songs you play or add to the queue show up here."
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
      <View className="min-h-ctl flex-row items-center justify-between px-page">
        <SectionLabel>{`Up next · ${upNext.length}`}</SectionLabel>
        {upNext.length > 0 ? (
          <Pressable
            onPress={clearUpNext}
            accessibilityRole="button"
            accessibilityLabel="Clear up next"
            hitSlop={TEXT_BUTTON_HIT_SLOP}
          >
            <Text variant="subhead">Clear</Text>
          </Pressable>
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
                  toast("Removed from queue");
                },
              }}
            />
          </View>
          <DragHandle name={item.name} />
        </View>
      )}
      ListHeaderComponent={header}
      ListEmptyComponent={
        <Text tone="muted" className="px-page py-4">
          Nothing else is queued.
        </Text>
      }
      contentInsetAdjustmentBehavior="automatic"
    />
  );
}
