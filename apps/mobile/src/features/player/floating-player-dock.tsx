import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import {
  FLOATING_DOCK_INSET,
  useFloatingDockOffset,
} from "~/navigation/player-dock";
import { selectCurrentTrack, usePlayer } from "~/playback/player-store";
import { radii, sizes } from "~/theme/tokens";
import { useTokenColor } from "~/theme/use-palette";

import { DockProgress } from "./dock-progress";
import { MiniPlayer } from "./mini-player";
import { usePlayerColors } from "./use-player-colors";
import { Backdrop, dockWash, OnWash } from "./wash";

/** Material 3 elevation level 2: the only shadowed element on Android (P9). */
const ELEVATION = 3;

/**
 * The Android mini player: a floating Material 3 card just above the
 * navigation bar, on the artwork's tonal surface (surface container high of
 * the scheme the cover seeds) once its colours pass the contrast check, the
 * wallpaper's `card` until then. The surface crossfades between tracks.
 */
export function FloatingPlayerDock() {
  const bottom = useFloatingDockOffset();
  const track = usePlayer(selectCurrentTrack);
  const colors = usePlayerColors(track?.image);
  // One object per palette, so `OnWash`'s theme stays put between renders.
  const wash = useMemo(() => (colors ? dockWash(colors) : null), [colors]);
  const card = useTokenColor("card");
  const primary = useTokenColor("primary");
  const background = colors?.dock.background ?? card;

  return (
    <View style={[styles.dock, { bottom, backgroundColor: background }]}>
      <Backdrop
        fill={{
          key: colors ? colors.dock.background : "card",
          style: { backgroundColor: background },
        }}
      />
      <OnWash colors={wash}>
        <MiniPlayer />
      </OnWash>
      <DockProgress color={colors?.dock.accent ?? primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  dock: {
    position: "absolute",
    left: FLOATING_DOCK_INSET,
    right: FLOATING_DOCK_INSET,
    height: sizes.dock,
    borderRadius: radii.lg,
    overflow: "hidden",
    elevation: ELEVATION,
  },
});
