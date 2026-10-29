import { createContext, use } from "react";
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

type TextTone = keyof typeof toneClasses;

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
const UPPERCASE = { textTransform: "uppercase" } as const;

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
   * Drawn in capitals (an eyebrow); screen readers keep the text as given,
   * not spelled out as an acronym.
   */
  uppercase?: boolean;
  /**
   * A computed colour that no tone names (text on an artwork-derived wash),
   * e.g. from `useTokenColor`; it replaces `tone`. Prefer `tone`.
   */
  color?: ColorValue;
};

/** Text colours for a surface the tokens do not cover, keyed by tone. */
export type TextInk = { default: string; muted: string; primary: string };

/**
 * Recolours the `default`, `muted` and `primary` tones of every `Text`
 * inside (rows laid on Now Playing's artwork wash, `OnWash`). On iOS the
 * tones are UIKit system colours that NativeWind variables cannot override,
 * so this is a context. The provider owns the contrast check.
 */
export const TextInkContext = createContext<TextInk | null>(null);

/** Text in the platform type scale and a semantic colour. */
export function Text({
  variant = "body",
  tone = "default",
  numeric = false,
  emphasized = false,
  uppercase = false,
  color: explicit,
  className,
  style,
  ...props
}: TextProps) {
  const ink = use(TextInkContext);
  const color =
    explicit ??
    (ink && (tone === "default" || tone === "muted" || tone === "primary")
      ? ink[tone]
      : undefined);
  return (
    <NativeText
      dynamicTypeRamp={RAMPS[variant]}
      accessibilityLabel={
        uppercase && typeof props.children === "string"
          ? props.children
          : undefined
      }
      className={cx(color === undefined && toneClasses[tone], className)}
      style={[
        textStyles[variant],
        numeric && TABULAR,
        uppercase && UPPERCASE,
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
