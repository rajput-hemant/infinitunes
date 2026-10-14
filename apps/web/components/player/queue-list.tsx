"use client";

import { useCurrentSongIndex, useQueue } from "~/hooks/use-store";

import { QueueRow } from "./queue-row";
import { useQueueRemoval } from "./use-queue-removal";

/** The queue rows, shared by the docked pane and expanded player. */
export function QueueList({ upNextOnly = false }: { upNextOnly?: boolean }) {
  const [queue] = useQueue();
  const [currentIndex] = useCurrentSongIndex();
  const { listRef, leaving, removeItem } = useQueueRemoval();

  return (
    <ol
      ref={listRef}
      tabIndex={-1}
      aria-label="Queue"
      className="text-muted-foreground outline-none"
    >
      {queue.map((item, index) =>
        upNextOnly && index <= currentIndex ? null : (
          <QueueRow
            key={item.queueItemId}
            item={item}
            isLeaving={leaving.has(item.queueItemId)}
            onRemove={() => removeItem(item.queueItemId)}
          />
        ),
      )}
    </ol>
  );
}
