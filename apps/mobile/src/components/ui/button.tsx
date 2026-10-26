import type { ReactNode } from "react";
import { Platform, Pressable, StyleSheet } from "react-native";
import type { PressableProps, StyleProp, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { cx } from "~/lib/class-names";
import { tap } from "~/lib/haptics";
import { usePressScale } from "~/lib/use-press-scale";
import { springs } from "~/theme/motion";
import { sizes, space } from "~/theme/tokens";
import { usePalette, useTokenColor } from "~/theme/use-palette";
import { useRadii } from "~/theme/use-radii";

import { Icon } from "./icon";
import type { SymbolName } from "./icon";
import { Text } from "./text";

const variants = {
  primary: {
    container: "bg-primary",
    fill: "primary",
    tone: "onPrimary",
    ink: "primary-foreground",
  },
  secondary: {
    container: "bg-secondary",
    fill: "secondary",
    tone: "onSecondary",
    ink: "secondary-foreground",
  },
  destructive: {
    container: "bg-destructive",
    fill: "destructive",
    tone: "onDestructive",
    ink: "destructive-foreground",
  },
} as const;

type ButtonProps = Omit<PressableProps, "children" | "className" | "style"> & {
  label: string;
  /** A leading symbol, e.g. play or shuffle. */
  icon?: SymbolName;
  /** A leading mark that is not a symbol (a provider's logo); replaces `icon`. */
  leading?: ReactNode;
  variant?: keyof typeof variants;
  /**
   * Layout only (a margin), set on the pressable itself. There is no class
   * prop: a wrapper view would cut Android's hit slop to its own bounds.
   */
  style?: StyleProp<ViewStyle>;
};

/**
 * A capsule action at the touch height: filled primary, a secondary that is
 * iOS's tinted capsule and Android's tonal button (`secondaryContainer`), or a
 * destructive one. It grows with its text and dims while disabled.
 */
export function Button(props: ButtonProps) {
  return Platform.OS === "android" ? (
    <MaterialButton {...props} />
  ) : (
    <CapsuleButton {...props} />
  );
}

function CapsuleButton({
  label,
  icon,
  leading,
  variant = "primary",
  style,
  onPress,
  onPressIn,
  onPressOut,
  ...props
}: ButtonProps) {
  const { container, tone, ink } = variants[variant];
  const inkColor = useTokenColor(ink);
  const press = usePressScale();

  return (
    <Animated.View style={[style, press.style]}>
      <Pressable
        accessibilityRole="button"
        className={cx(
          "min-h-touch flex-row items-center justify-center gap-2 rounded-full px-4 py-2 active:opacity-80 disabled:opacity-50",
          container,
        )}
        {...props}
        onPress={(event) => {
          tap();
          onPress?.(event);
        }}
        onPressIn={(event) => {
          press.onPressIn();
          onPressIn?.(event);
        }}
        onPressOut={(event) => {
          press.onPressOut();
          onPressOut?.(event);
        }}
      >
        {leading ??
          (icon ? (
            <Icon name={icon} size="md" color={inkColor} weight="semibold" />
          ) : null)}
        <Text variant="label" tone={tone}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** The 40dp button's slop to the 48dp target. */
const BUTTON_HIT_SLOP = { top: 4, bottom: 4 } as const;
const AT_REST = sizes.ctl / 2;

/**
 * Material 3 Expressive's small button: 40dp high (48dp with slop), fully
 * round at rest, its corners morphing to the small shape while pressed on the
 * fast spatial spring. The pressable is the outermost view and the clipped,
 * shaped one: Android drops a touch outside a parent's bounds (its children's
 * frames, never their slop) before reaching a child, so slop on a wrapped
 * pressable never fires.
 */
function MaterialButton({
  label,
  icon,
  leading,
  variant = "primary",
  style,
  onPress,
  onPressIn,
  onPressOut,
  ...props
}: ButtonProps) {
  const { fill, tone, ink } = variants[variant];
  const inkColor = useTokenColor(ink);
  const backgroundColor = useTokenColor(fill);
  const ripple = usePalette()["fill-3"];
  const pressedRadius = useRadii().sm;
  const radius = useSharedValue(AT_REST);
  const shape = useAnimatedStyle(() => ({ borderRadius: radius.get() }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      hitSlop={BUTTON_HIT_SLOP}
      android_ripple={{ color: ripple, foreground: true }}
      onPressIn={(event) => {
        radius.set(withSpring(pressedRadius, springs.spatialFast));
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        radius.set(withSpring(AT_REST, springs.spatialFast));
        onPressOut?.(event);
      }}
      {...props}
      onPress={(event) => {
        tap();
        onPress?.(event);
      }}
      style={[
        styles.button,
        { backgroundColor },
        props.disabled ? styles.disabled : undefined,
        style,
        shape,
      ]}
    >
      {leading ??
        (icon ? <Icon name={icon} size="md" color={inkColor} /> : null)}
      <Text variant="label" tone={tone}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: sizes.ctl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.sm,
    paddingHorizontal: space.lg,
    overflow: "hidden",
  },
  disabled: { opacity: 0.5 },
});
