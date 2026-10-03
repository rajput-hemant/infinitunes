import type { Queue } from "@infinitunes/types";

type QueueEntry = Pick<Queue, "id" | "queueItemId" | "url">;

/**
 * Whether a track row is the one currently playing. A row that is itself a
 * queue entry (`queueItemId` present in the queue) is compared by that unique
 * id, so a track queued several times only highlights the playing copy. Any
 * other row (album/playlist lists) falls back to the track id.
 */
export function isCurrentTrack(
  queue: readonly Pick<Queue, "id" | "queueItemId">[],
  currentIndex: number,
  row: { id: string; queueItemId?: string },
): boolean {
  const current = queue[currentIndex];
  if (!current) return false;
  if (
    row.queueItemId !== undefined &&
    queue.some((item) => item.queueItemId === row.queueItemId)
  ) {
    return current.queueItemId === row.queueItemId;
  }
  return current.id === row.id;
}

/**
 * Index of the queue entry a play button should jump to: the exact entry when
 * the button belongs to a queue row, otherwise the first entry with this token.
 */
export function findQueueIndex(
  queue: readonly QueueEntry[],
  target: { token: string; queueItemId?: string },
  tokenOf: (url: string) => string,
): number {
  if (target.queueItemId !== undefined) {
    const exact = queue.findIndex(
      (item) => item.queueItemId === target.queueItemId,
    );
    if (exact !== -1) return exact;
  }
  return queue.findIndex((item) => tokenOf(item.url) === target.token);
}
