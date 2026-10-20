import { Platform, Text as NativeText } from "react-native";
import type { TextProps as NativeTextProps } from "react-native";

import { cx } from "~/lib/class-names";
import { typeScale } from "~/theme/tokens";
import type { TextVariant } from "~/theme/tokens";

const scale = Platform.OS === "ios" ? typeScale.ios : typeScale.android;

const toneClasses = {
  default: "text-foreground",
  muted: "text-muted-foreground",
  onPrimary: "text-primary-foreground",
} as const;

export type TextProps = NativeTextProps & {
  variant?: TextVariant;
  /** The colour; pass it here rather than as a `text-*` class. */
  tone?: keyof typeof toneClasses;
};

/** Text in the platform type scale and a semantic colour. */
export function Text({
  variant = "body",
  tone = "default",
  className,
  style,
  ...props
}: TextProps) {
  return (
    <NativeText
      className={cx(toneClasses[tone], className)}
      style={[scale[variant], style]}
      {...props}
    />
  );
}
