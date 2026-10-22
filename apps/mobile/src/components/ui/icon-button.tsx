import { Platform, Pressable } from "react-native";
import type { ColorValue } from "react-native";

import { cx } from "~/lib/class-names";
import type { IconSize } from "~/theme/tokens";
import { usePalette, useTokenColor } from "~/theme/use-palette";

import { Icon } from "./icon";
import type { SymbolName } from "./icon";

/**
 * `standard` is a bare symbol; `filled` (primary) and `tonal` (iOS's tinted
 * fill, Android's `secondaryContainer`) sit in a round container: the compact
 * form of a labelled button, where the symbol alone is unambiguous (Play,
 * Shuffle).
 */
const variants = {
  standard: { container: undefined, ink: undefined },
  filled: { container: "bg-primary", ink: "primary-foreground" },
  tonal: { container: "bg-secondary", ink: "secondary-foreground" },
} as const;

type IconButtonProps = {
  icon: SymbolName;
  /** What the button does, for screen readers ("Pause", "Like FA9LA"). */
  label: string;
  onPress: () => void;
  /** An `iconSize` name: `md` in rows, `lg` (the default) in headers. */
  size?: IconSize;
  color?: ColorValue;
  variant?: keyof typeof variants;
  /** A 56pt container (a header's Play) instead of the 48pt target. */
  large?: boolean;
  /** A toggle's state (shuffle on, liked). */
  selected?: boolean;
  disabled?: boolean;
};

/** A symbol button with a 48pt (or 56pt `large`) touch target. */
export function IconButton({
  icon,
  label,
  onPress,
  size = "lg",
  color,
  variant = "standard",
  large = false,
  selected,
  disabled = false,
}: IconButtonProps) {
  const { container, ink } = variants[variant];
  const inkColor = useTokenColor(ink ?? "foreground");
  const ripple = usePalette()["fill-2"];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled }}
      android_ripple={{
        color: ripple,
        borderless: !container,
        foreground: true,
      }}
      className={cx(
        "items-center justify-center disabled:opacity-40",
        large ? "size-row" : "min-h-touch min-w-touch",
        container && "overflow-hidden rounded-full",
        container,
        Platform.OS === "ios" && "active:opacity-60",
      )}
    >
      <Icon
        name={icon}
        size={size}
        color={color ?? (ink ? inkColor : undefined)}
      />
    </Pressable>
  );
}
