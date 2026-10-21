import { formatCount } from "@infinitunes/types";
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

/**
 * A running time in words, to the nearest minute (spec 2.9): "38 min",
 * "1 hr 12 min", "2 hr"; under a minute still reads "1 min". Nothing for 0.
 */
export function durationInWords(seconds: number): string {
  if (!(seconds > 0)) return "";
  const minutes = Math.max(1, Math.round(seconds / 60));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`;
}

/** The running time of a collection ("1 hr 12 min"), or nothing for an empty one. */
export function totalDurationLabel(rows: readonly SongRowItem[]): string {
  return durationInWords(rows.reduce((sum, row) => sum + row.duration, 0));
}
