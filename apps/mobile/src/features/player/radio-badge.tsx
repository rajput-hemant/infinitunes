import { useTheme } from "expo-router";
import { View } from "react-native";

import { Icon } from "~/components/ui/icon";
import { Text } from "~/components/ui/text";
import { usePlayer } from "~/playback/player-store";

/**
 * The station the queue refills from (the web player's "Radio" badge);
 * nothing while the queue is not a radio session.
 */
export function RadioBadge() {
  const { colors } = useTheme();
  const name = usePlayer((state) => state.radio?.name);
  if (!name) return null;

  return (
    <View
      accessible
      accessibilityLabel={`Playing ${name}`}
      className="shrink flex-row items-center gap-1 self-start rounded-sm bg-secondary px-1.5 py-0.5"
    >
      <Icon
        name={{ ios: "dot.radiowaves.left.and.right", android: "radio" }}
        size={11}
        color={colors.primary}
      />
      <Text variant="caption" numberOfLines={1}>
        {name}
      </Text>
    </View>
  );
}
