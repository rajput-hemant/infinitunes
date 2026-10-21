import { StyleSheet } from "react-native";

import { GlassSurface } from "~/components/ui/glass-surface";
import {
  FLOATING_DOCK_INSET,
  useFloatingDockOffset,
} from "~/navigation/player-dock";
import { sizes } from "~/theme/tokens";
import { useTokenColor } from "~/theme/use-palette";

import { DockProgress } from "./dock-progress";
import { MiniPlayer } from "./mini-player";

/**
 * The mini player before iOS 26 (no tab bar accessory): a floating capsule
 * of system material just above the tab bar. Glass is floating chrome (P2),
 * so it keeps the system's colours: an artwork tint under translucent
 * material could not be contrast-checked. The wash lives in Now Playing.
 */
export function FloatingPlayerDock() {
  const bottom = useFloatingDockOffset();
  const primary = useTokenColor("primary");
  return (
    <GlassSurface style={[styles.dock, { bottom }]}>
      <MiniPlayer />
      <DockProgress color={primary} />
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  dock: {
    position: "absolute",
    left: FLOATING_DOCK_INSET,
    right: FLOATING_DOCK_INSET,
    height: sizes.dock,
    borderRadius: sizes.dock / 2,
    borderCurve: "continuous",
    overflow: "hidden",
  },
});
