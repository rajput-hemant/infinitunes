import { formatCount, formatDuration } from "@infinitunes/types";
import type { SongRowItem } from "@infinitunes/types";

/** The parts that exist, joined the way the web header joins its meta line. */
export function joinMeta(parts: readonly (string | undefined)[]): string {
  return parts.filter(Boolean).join(" · ");
}

/** "8.3M Plays", or nothing when upstream has no play count. */
export function playsLabel(count: number | string | undefined): string {
  return Number(count) > 0 ? `${formatCount(count)} Plays` : "";
}

export function songCountLabel(count: number): string {
  return `${count} ${count === 1 ? "Song" : "Songs"}`;
}

/** The running time of a collection, or nothing for an empty one. */
export function totalDurationLabel(rows: readonly SongRowItem[]): string {
  const seconds = rows.reduce((sum, row) => sum + row.duration, 0);
  return seconds > 0 ? formatDuration(seconds, "mm:ss") : "";
}
