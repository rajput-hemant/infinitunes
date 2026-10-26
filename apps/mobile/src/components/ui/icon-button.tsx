import { Platform, Pressable, StyleSheet, View } from "react-native";
import type { ColorValue, StyleProp, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { cx } from "~/lib/class-names";
import { tap } from "~/lib/haptics";
import { usePressScale } from "~/lib/use-press-scale";
import { springs } from "~/theme/motion";
import { sizes } from "~/theme/tokens";
import type { IconSize } from "~/theme/tokens";
import { usePalette, useTokenColor } from "~/theme/use-palette";
import { useRadii } from "~/theme/use-radii";

import { Icon } from "./icon";
import type { SymbolName } from "./icon";

/**
 * `standard` is a bare symbol; `filled` (primary) and `tonal` (iOS's tinted
 * fill, Android's `secondaryContainer`) sit in a round container: the compact
 * form of a labelled button, where the symbol alone is unambiguous (Play,
 * Shuffle).
 */
const variants = {
  standard: { container: undefined, fill: undefined, ink: undefined },
  filled: {
    container: "bg-primary",
    fill: "primary",
    ink: "primary-foreground",
  },
  tonal: {
    container: "bg-secondary",
    fill: "secondary",
    ink: "secondary-foreground",
  },
} as const;

type IconButtonProps = {
  icon: SymbolName;
  /** What the button does, for screen readers ("Pause", "Like FA9LA"). */
  label: string;
  onPress: () => void;
  /** False when the action supplies its own haptic (a like). */
  haptic?: boolean;
  /** An `iconSize` name: `md` in rows, `lg` (the default) in headers. */
  size?: IconSize;
  color?: ColorValue;
  variant?: keyof typeof variants;
  /** A 56pt container (a header's Play) instead of the 48pt target. */
  large?: boolean;
  /**
   * A toggle's state (lyrics shown): a standard button then sits in the tonal
   * container, so the state is seen, not only announced.
   */
  selected?: boolean;
  disabled?: boolean;
  /**
   * Work is under way (a Play that is fetching): announced as busy and presses
   * are ignored, but the button does not dim as `disabled` does.
   */
  busy?: boolean;
  /** A container colour that no variant names (a wash's control); `filled`/`tonal` only. */
  fill?: ColorValue;
  /** The contained Android button's resting corner radius in px (default: round). */
  restRadius?: number;
  /** Layout only (a position); set on the outermost view. */
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * A symbol button with a 48pt (or 56pt `large`) touch target. Android's
 * contained buttons are Material 3 Expressive's: a 40dp container reaching
 * 48dp with slop (56dp `large`), its corners morphing to the small shape
 * while pressed.
 */
export function IconButton(props: IconButtonProps) {
  return Platform.OS === "android" &&
    props.variant !== undefined &&
    props.variant !== "standard" ? (
    <MaterialIconButton {...props} variant={props.variant} />
  ) : (
    <SymbolButton {...props} />
  );
}

/** The press handler: a tap, then the action (nothing while busy). */
function pressWith(onPress: () => void, busy: boolean, haptic: boolean) {
  if (busy) return undefined;
  return () => {
    if (haptic) tap();
    onPress();
  };
}

function SymbolButton({
  icon,
  label,
  onPress,
  haptic = true,
  size = "lg",
  color,
  variant = "standard",
  large = false,
  selected,
  disabled = false,
  busy = false,
  fill,
  style,
  testID,
}: IconButtonProps) {
  const { container, ink } = variants[variant];
  // iOS: buttons sink a little under the finger (bare symbols too).
  const ios = Platform.OS === "ios";
  const press = usePressScale();
  const inkColor = useTokenColor(ink ?? "foreground");
  const selectedInk = useTokenColor("secondary-foreground");
  const ripple = usePalette()["fill-2"];
  // A selected bare symbol takes the tonal container inside the same target.
  const tonal = selected && !container;
  const button = (
    <Pressable
      onPress={pressWith(onPress, busy, haptic)}
      onPressIn={ios ? press.onPressIn : undefined}
      onPressOut={ios ? press.onPressOut : undefined}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled, busy }}
      testID={testID}
      style={[fill !== undefined && { backgroundColor: fill }, !ios && style]}
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
        ios && !busy && "active:opacity-60",
      )}
    >
      {tonal ? (
        <View className="size-ctl items-center justify-center rounded-full bg-secondary">
          <Icon name={icon} size={size} color={color ?? selectedInk} />
        </View>
      ) : (
        <Icon
          name={icon}
          size={size}
          color={color ?? (ink ? inkColor : undefined)}
        />
      )}
    </Pressable>
  );
  return ios ? (
    <Animated.View style={[style, press.style]}>{button}</Animated.View>
  ) : (
    button
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** The 40dp container's slop to the 48dp target, on every side. */
const CONTAINED_INSET = (sizes.touch - sizes.ctl) / 2;
const CONTAINED_HIT_SLOP = {
  top: CONTAINED_INSET,
  bottom: CONTAINED_INSET,
  left: CONTAINED_INSET,
  right: CONTAINED_INSET,
} as const;

/**
 * The pressable is the outermost view so its slop is hit-tested: Android
 * drops touches outside an `overflow: hidden` parent before reaching a child.
 * The radius springs on `springs.spatialFast` as `Button`'s does; worklet
 * springs follow reduce motion (`ReduceMotion.System`), jumping to the shape.
 */
function MaterialIconButton({
  icon,
  label,
  onPress,
  haptic = true,
  size = "lg",
  color,
  variant,
  large = false,
  selected,
  disabled = false,
  busy = false,
  fill: fillColor,
  restRadius,
  style,
  testID,
}: IconButtonProps & { variant: "filled" | "tonal" }) {
  const { fill, ink } = variants[variant];
  const inkColor = useTokenColor(ink);
  const tokenFill = useTokenColor(fill);
  const backgroundColor = fillColor ?? tokenFill;
  const ripple = usePalette()["fill-3"];
  const pressedRadius = useRadii().sm;
  const edge = large ? sizes.row : sizes.ctl;
  const atRest = restRadius ?? edge / 2;
  const radius = useSharedValue(atRest);
  const shape = useAnimatedStyle(() => ({ borderRadius: radius.get() }));
  return (
    <AnimatedPressable
      onPress={pressWith(onPress, busy, haptic)}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled, busy }}
      testID={testID}
      hitSlop={large ? undefined : CONTAINED_HIT_SLOP}
      android_ripple={{ color: ripple, foreground: true }}
      onPressIn={() => {
        radius.set(withSpring(pressedRadius, springs.spatialFast));
      }}
      onPressOut={() => {
        radius.set(withSpring(atRest, springs.spatialFast));
      }}
      style={[
        styles.contained,
        { width: edge, height: edge, backgroundColor },
        disabled && styles.disabled,
        style,
        shape,
      ]}
    >
      <Icon name={icon} size={size} color={color ?? inkColor} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  contained: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  disabled: { opacity: 0.4 },
});
