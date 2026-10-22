import { useTheme } from "expo-router";
import { View } from "react-native";

import { Icon } from "~/components/ui/icon";
import { Text } from "~/components/ui/text";
import { usePlayer } from "~/playback/player-store";

import { useWashColors, WashText } from "./wash";

/**
 * The station the queue refills from (the web player's "Radio" badge);
 * nothing while the queue is not a radio session. On the D1 palette it is a
 * tonal chip; on a wash the chip's fill could not be contrast-checked, so it
 * is an inline mark in the wash's muted colour, ending in a separator dot.
 */
export function RadioBadge() {
  const { colors } = useTheme();
  const wash = useWashColors();
  const name = usePlayer((state) => state.radio?.name);
  if (!name) return null;

  const icon = {
    ios: "dot.radiowaves.left.and.right",
    android: "radio",
  } as const;
  if (wash) {
    return (
      <View
        accessible
        accessibilityLabel={`Playing ${name}`}
        className="shrink flex-row items-center gap-1"
      >
        <Icon name={icon} size="xs" color={wash.muted} />
        <WashText variant="caption" tone="muted" numberOfLines={1}>
          {name}
        </WashText>
        {/* No chip edge here, so a dot keeps the station off the subtitle. */}
        <WashText variant="caption" tone="muted">
          ·
        </WashText>
      </View>
    );
  }

  return (
    <View
      accessible
      accessibilityLabel={`Playing ${name}`}
      className="shrink flex-row items-center gap-1 self-start rounded-xs bg-secondary px-1"
    >
      <Icon name={icon} size="xs" color={colors.primary} />
      <Text variant="caption" tone="onSecondary" numberOfLines={1}>
        {name}
      </Text>
    </View>
  );
}
