import { Text as NativeText } from "react-native";
import type { ColorValue, TextProps as NativeTextProps } from "react-native";

import { cx } from "~/lib/class-names";
import { emphasizedWeights, textStyles } from "~/theme/tokens";
import type { TextVariant } from "~/theme/tokens";

const toneClasses = {
  default: "text-foreground",
  muted: "text-muted-foreground",
  /** Accent text: the playing row's title. */
  primary: "text-primary",
  onPrimary: "text-primary-foreground",
  /** Text on a `bg-secondary` (tonal) fill. */
  onSecondary: "text-secondary-foreground",
  onDestructive: "text-destructive-foreground",
  error: "text-destructive",
} as const;

export type TextTone = keyof typeof toneClasses;

/** iOS scales each role along its own Dynamic Type text style (Android ignores the prop). */
const RAMPS = {
  largeTitle: "largeTitle",
  title1: "title1",
  title2: "title2",
  headline: "headline",
  body: "body",
  label: "headline",
  subhead: "subheadline",
  footnote: "footnote",
  caption: "caption1",
} as const satisfies Record<TextVariant, NativeTextProps["dynamicTypeRamp"]>;

const TABULAR = { fontVariant: ["tabular-nums"] } as const;

export type TextProps = NativeTextProps & {
  /** The role in the type ramp (`body` by default). */
  variant?: TextVariant;
  /** The colour; pass it here rather than as a `text-*` class or `style.color`. */
  tone?: TextTone;
  /** Tabular figures, for times and track numbers. */
  numeric?: boolean;
  /** Material 3 Expressive's emphasized style (a weight up) on Android; nothing on iOS. */
  emphasized?: boolean;
  /**
   * A computed colour that no tone names (text on an artwork-derived wash),
   * e.g. from `useTokenColor`; it replaces `tone`. Prefer `tone`.
   */
  color?: ColorValue;
};

/** Text in the platform type scale and a semantic colour. */
export function Text({
  variant = "body",
  tone = "default",
  numeric = false,
  emphasized = false,
  color,
  className,
  style,
  ...props
}: TextProps) {
  return (
    <NativeText
      dynamicTypeRamp={RAMPS[variant]}
      className={cx(color === undefined && toneClasses[tone], className)}
      style={[
        textStyles[variant],
        numeric && TABULAR,
        emphasized &&
          emphasizedWeights[variant] && {
            fontWeight: emphasizedWeights[variant],
          },
        color !== undefined && { color },
        style,
      ]}
      {...props}
    />
  );
}
