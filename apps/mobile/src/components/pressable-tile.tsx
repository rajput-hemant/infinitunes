import { Link } from "expo-router";
import type { Href } from "expo-router";
import type { ReactNode } from "react";
import { Pressable } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import Animated from "react-native-reanimated";

import { usePressScale } from "~/lib/use-press-scale";

type PressableTileProps = {
  width: number;
  href: Href;
  accessibilityLabel: string;
  /** Classes of the pressable surface (the tile's fill, corners and layout). */
  className: string;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

/**
 * A tile that links to `href` and sinks under the finger (the Library hub's and
 * Browse's tiles): a press-scale wrapper around a link-role pressable.
 */
export function PressableTile({
  width,
  href,
  accessibilityLabel,
  className,
  style,
  children,
}: PressableTileProps) {
  const press = usePressScale(0.97);
  return (
    <Animated.View style={[{ width }, press.style]}>
      <Link href={href} asChild>
        <Pressable
          onPressIn={press.onPressIn}
          onPressOut={press.onPressOut}
          accessibilityRole="link"
          accessibilityLabel={accessibilityLabel}
          className={className}
          style={style}
        >
          {children}
        </Pressable>
      </Link>
    </Animated.View>
  );
}
