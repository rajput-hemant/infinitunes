import { getImageSrc } from "@infinitunes/types";
import type { Queue } from "@infinitunes/types";

/**
 * The artwork the glass engine follows: the 500px image of the playing track
 * (the CDN sends CORS headers for it), or `null` when nothing plays.
 */
export function trackArtworkUrl(track: Queue | undefined): string | null {
  return track?.image ? getImageSrc(track.image, "high") : null;
}
