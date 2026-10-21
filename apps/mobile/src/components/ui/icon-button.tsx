import type { SymbolViewProps } from "expo-symbols";
import { Pressable } from "react-native";
import type { ColorValue } from "react-native";

import { Icon } from "./icon";

type IconButtonProps = {
  icon: SymbolViewProps["name"];
  /** What the button does, for screen readers ("Pause", "Like FA9LA"). */
  label: string;
  onPress: () => void;
  size?: number;
  color?: ColorValue;
  /** A toggle's state (shuffle on, liked). */
  selected?: boolean;
  disabled?: boolean;
};

/** A bare symbol button with a touch target of at least the control size. */
export function IconButton({
  icon,
  label,
  onPress,
  size = 22,
  color,
  selected,
  disabled = false,
}: IconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled }}
      className="min-h-ctl min-w-ctl items-center justify-center active:opacity-60 disabled:opacity-40"
    >
      <Icon name={icon} size={size} color={color} />
    </Pressable>
  );
}
