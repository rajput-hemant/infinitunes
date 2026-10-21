import type { SymbolViewProps } from "expo-symbols";
import type { ReactNode } from "react";
import { useRef } from "react";
import { Pressable, View } from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import type { SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";

import { Icon } from "~/components/ui/icon";
import { Text } from "~/components/ui/text";
import { useTokenColor } from "~/theme/use-palette";

export type SwipeAction = {
  label: string;
  icon: SymbolViewProps["name"];
  onPress: () => void;
};

/**
 * A row with one destructive action behind a left swipe. The swipe is a
 * shortcut: every action also lives in the row's own menu.
 */
export function SwipeableRow({
  action,
  children,
}: {
  action: SwipeAction;
  children: ReactNode;
}) {
  const ink = useTokenColor("destructive-foreground");
  const swipeable = useRef<SwipeableMethods>(null);

  return (
    <ReanimatedSwipeable
      ref={swipeable}
      overshootRight={false}
      renderRightActions={() => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={action.label}
          onPress={() => {
            swipeable.current?.close();
            action.onPress();
          }}
          className="min-w-row items-center justify-center gap-1 bg-destructive px-4"
        >
          {/* The destructive fill's own text colour: white fails AA on dark's lighter red. */}
          <Icon name={action.icon} size="md" color={ink} />
          <Text variant="caption" tone="onDestructive">
            {action.label}
          </Text>
        </Pressable>
      )}
    >
      {/* Opaque, or the action behind shows through the resting row. */}
      <View className="bg-background">{children}</View>
    </ReanimatedSwipeable>
  );
}
