import { Pressable } from "react-native";
import type { ColorValue } from "react-native";

import { Icon } from "./icon";
import type { IconSizeProp, SymbolName } from "./icon";

type IconButtonProps = {
  icon: SymbolName;
  /** What the button does, for screen readers ("Pause", "Like FA9LA"). */
  label: string;
  onPress: () => void;
  /** An `iconSize` name (`md` in rows, `lg` in headers) or, until moved, points. */
  size?: IconSizeProp;
  color?: ColorValue;
  /** A toggle's state (shuffle on, liked). */
  selected?: boolean;
  disabled?: boolean;
};

/** A bare symbol button with a 48pt touch target. */
export function IconButton({
  icon,
  label,
  onPress,
  size = "lg",
  color,
  selected,
  disabled = false,
}: IconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled }}
      className="min-h-touch min-w-touch items-center justify-center active:opacity-60 disabled:opacity-40"
    >
      <Icon name={icon} size={size} color={color} />
    </Pressable>
  );
}
