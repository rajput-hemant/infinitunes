import { FlashList } from "@shopify/flash-list";

import { EmptyState } from "~/components/empty-state";
import { SongRow } from "~/components/song-row";
import { playerStore, usePlayer } from "~/playback/player-store";

/** The queue sheet: every entry, the playing one highlighted; tap to jump, menu to remove. */
export function QueueList() {
  const queue = usePlayer((state) => state.queue);
  const { playAt, removeAt } = playerStore.getState();

  if (queue.length === 0) {
    return (
      <EmptyState
        icon={{ ios: "list.bullet", android: "queue_music" }}
        title="Nothing queued"
        message="Songs you play or add to the queue show up here."
      />
    );
  }

  return (
    <FlashList
      data={queue}
      keyExtractor={(entry) => entry.queueItemId}
      renderItem={({ item, index }) => (
        <SongRow
          song={item}
          queueItemId={item.queueItemId}
          onPress={() => playAt(index)}
          removal={{
            title: "Remove from Queue",
            onRemove: () => removeAt(index),
          }}
        />
      )}
      contentInsetAdjustmentBehavior="automatic"
    />
  );
}
