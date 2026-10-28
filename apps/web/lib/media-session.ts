import { decode, getImageSrc, type Queue } from "@infinitunes/types";

/** The title, artist line and artwork the OS shows for a queue entry. */
export function mediaMetadataInit(
  track: Pick<Queue, "name" | "subtitle" | "image" | "artists">,
): MediaMetadataInit {
  const artist =
    track.artists.map((a) => decode(a.name)).join(", ") ||
    decode(track.subtitle);
  return {
    title: decode(track.name),
    artist,
    // The CDN serves these two sizes (what the rest of the app asks for).
    artwork: (["medium", "high"] as const).map((quality) => {
      const src = getImageSrc(track.image, quality);
      return { src, sizes: quality === "medium" ? "150x150" : "500x500" };
    }),
  };
}

/** `setPositionState` throws for a zero/unknown duration or a position past the end. */
export function positionStateOf(
  duration: number,
  position: number,
): MediaPositionState | undefined {
  if (!Number.isFinite(duration) || duration <= 0) return undefined;
  const at = Number.isFinite(position) ? position : 0;
  return {
    duration,
    position: Math.min(Math.max(at, 0), duration),
    playbackRate: 1,
  };
}
