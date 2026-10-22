import { PlatformColor } from "react-native";
import type { ColorValue } from "react-native";

import type { SymbolName } from "~/components/ui/icon";

/** An SF Symbol name (iOS row icons). */
export type SFSymbol = Extract<SymbolName, string>;

/**
 * The iOS row icons' tile colours: UIKit's system colours, as the Settings
 * app uses, so they follow light and dark mode and Increase Contrast.
 */
export const ROW_TINT = {
  blue: PlatformColor("systemBlue"),
  gray: PlatformColor("systemGray"),
  green: PlatformColor("systemGreen"),
  indigo: PlatformColor("systemIndigo"),
  orange: PlatformColor("systemOrange"),
  pink: PlatformColor("systemPink"),
  red: PlatformColor("systemRed"),
  teal: PlatformColor("systemTeal"),
} as const;

export type TapRowProps = {
  label: string;
  /** A second line under the label. */
  detail?: string;
  onPress: () => void;
  /** A tinted leading icon (iOS): a `ROW_TINT`, or the accent's own colour. */
  icon?: { name: SFSymbol; color?: ColorValue };
};

export type ActionRowProps = TapRowProps & {
  /** Colours the label red, for sign out and delete. */
  destructive?: boolean;
};
