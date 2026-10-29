import { useMemo } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  ReduceMotion,
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";

import { Backdrop, dockWash, OnWash } from "~/components/wash";
import { usePlayerColors } from "~/lib/use-player-colors";
import { useFloatingDockOffset } from "~/navigation/player-dock";
import { selectCurrentTrack, usePlayer } from "~/playback/player-store";
import { springs } from "~/theme/motion";
import { sizes } from "~/theme/tokens";
import { useTokenColor } from "~/theme/use-palette";

import { DockProgress } from "./dock-progress";
import { MiniPlayer } from "./mini-player";

/** Material 3 elevation level 2: the only shadowed element on Android (P9). */
const ELEVATION = 3;

/** The strip slides in from under the navigation bar on the default spatial spring; reduce motion snaps it. */
const ENTER = SlideInDown.springify()
  .stiffness(springs.spatialDefault.stiffness)
  .damping(springs.spatialDefault.damping)
  .reduceMotion(ReduceMotion.System);
const EXIT = SlideOutDown.springify()
  .stiffness(springs.spatialDefault.stiffness)
  .damping(springs.spatialDefault.damping)
  .reduceMotion(ReduceMotion.System);

/**
 * The Android mini player: an edge-to-edge strip fused to the top of the
 * navigation bar (no inset, no corners), on the artwork's tonal surface
 * (surface container high of the scheme the cover seeds) once its colours
 * pass the contrast check, the wallpaper's `card` until then. The progress
 * line runs along its top edge. It exists only while a track does.
 */
export function FloatingPlayerDock() {
  const track = usePlayer(selectCurrentTrack);
  return track ? <DockStrip image={track.image} /> : null;
}

function DockStrip({ image }: { image: string }) {
  const bottom = useFloatingDockOffset();
  const colors = usePlayerColors(image);
  // One object per palette, so `OnWash`'s theme stays put between renders.
  const wash = useMemo(() => (colors ? dockWash(colors) : null), [colors]);
  const card = useTokenColor("card");
  const primary = useTokenColor("primary");
  const background = colors?.dock.background ?? card;

  return (
    <Animated.View
      testID="dock-strip"
      entering={ENTER}
      exiting={EXIT}
      style={[styles.dock, { bottom, backgroundColor: background }]}
    >
      <Backdrop
        fill={{
          key: colors ? colors.dock.background : "card",
          style: { backgroundColor: background },
        }}
      />
      <OnWash colors={wash}>
        <MiniPlayer />
      </OnWash>
      <DockProgress color={colors?.dock.accent ?? primary} edge="top" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  dock: {
    position: "absolute",
    // A strip, not a card: edge to edge, no corners.
    left: 0,
    right: 0,
    height: sizes.dock,
    overflow: "hidden",
    elevation: ELEVATION,
  },
});
