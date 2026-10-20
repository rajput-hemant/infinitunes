import { StyleSheet } from "react-native";

import { GlassSurface } from "~/components/ui/glass-surface";
import {
  FLOATING_DOCK_HEIGHT,
  useFloatingDockOffset,
} from "~/navigation/player-dock";
import { radii } from "~/theme/tokens";

import { MiniPlayer } from "./mini-player";

/**
 * The mini-player where the tab bar has no accessory slot (Android, iOS
 * before 26): a floating surface just above the tab bar.
 */
export function FloatingPlayerDock() {
  const bottom = useFloatingDockOffset();
  return (
    <GlassSurface style={[styles.dock, { bottom }]}>
      <MiniPlayer />
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  dock: {
    position: "absolute",
    left: 12,
    right: 12,
    height: FLOATING_DOCK_HEIGHT,
    borderRadius: radii.xl,
    borderCurve: "continuous",
  },
});
