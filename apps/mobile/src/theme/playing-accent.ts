import { useMemo } from "react";
import { Platform } from "react-native";

import type { PlayerColors } from "~/lib/artwork-colors";
import {
  contrastRatio,
  MIN_CONTROL_CONTRAST,
  MIN_TEXT_CONTRAST,
} from "~/lib/artwork-colors";
import { usePlayerColors } from "~/lib/use-player-colors";
import { selectCurrentTrack, usePlayer } from "~/playback/player-store";

import { useAccent } from "./appearance";
import { usePalette } from "./use-palette";

export type PlayingAccent = { primary: string; foreground: string };

const HEX = /^#[\da-f]{6}$/i;

/**
 * The accent of what is playing: the cover's Material `primary` (the dock's
 * accent) and its `onPrimary` text, or `undefined` when the accent misses
 * 3:1 on the page `background` or its text misses 4.5:1 on it.
 */
export function playingAccentFrom(
  colors: PlayerColors | null,
  background: string,
): PlayingAccent | undefined {
  if (!colors || !HEX.test(background)) return undefined;
  const primary = colors.dock.accent;
  const foreground = colors.onControl;
  return contrastRatio(primary, background) >= MIN_CONTROL_CONTRAST &&
    contrastRatio(foreground, primary) >= MIN_TEXT_CONTRAST
    ? { primary, foreground }
    : undefined;
}

/**
 * Android: `primary` and its text from the current track's cover while the
 * accent preference is `default` (the wallpaper otherwise, and when nothing
 * plays or a check fails). An explicit accent wins. iOS: always `undefined`.
 */
export function usePlayingAccent(): PlayingAccent | undefined {
  const preference = useAccent();
  const enabled = Platform.OS === "android" && preference === "default";
  const track = usePlayer(selectCurrentTrack);
  const colors = usePlayerColors(enabled ? track?.image : undefined);
  const { background } = usePalette();
  return useMemo(
    () => (enabled ? playingAccentFrom(colors, background) : undefined),
    [enabled, colors, background],
  );
}
