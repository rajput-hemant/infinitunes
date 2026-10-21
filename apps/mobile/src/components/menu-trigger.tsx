import type { SymbolViewProps } from "expo-symbols";
import { View } from "react-native";

import { cx } from "~/lib/class-names";
import type { IconSize } from "~/theme/tokens";

import { Icon } from "./ui/icon";

type MenuTriggerProps = {
  /** What the menu is for, for screen readers ("More actions for Song"). */
  label: string;
  /** Defaults to the horizontal ellipsis. */
  icon?: SymbolViewProps["name"];
  /** `md` (row controls) by default; `lg` in headers. */
  size?: IconSize;
  /** Extra classes, e.g. a filled background beside other buttons. */
  className?: string;
};

/**
 * The visible face of a `NativeMenu`: one accessible button at the 48pt touch
 * size. The menu takes the press itself, so the trigger can neither take hit
 * slop nor be made smaller than its target.
 */
export function MenuTrigger({
  label,
  icon = { ios: "ellipsis", android: "more_vert" },
  size = "md",
  className,
}: MenuTriggerProps) {
  return (
    <View
      accessible
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="Opens a menu"
      className={cx("size-touch items-center justify-center", className)}
    >
      <Icon name={icon} size={size} />
    </View>
  );
}
