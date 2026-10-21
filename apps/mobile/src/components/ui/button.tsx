import { Pressable } from "react-native";
import type { PressableProps } from "react-native";

import { cx } from "~/lib/class-names";
import { useTokenColor } from "~/theme/use-palette";

import { Icon } from "./icon";
import type { SymbolName } from "./icon";
import { Text } from "./text";

const variants = {
  primary: {
    container: "bg-primary",
    tone: "onPrimary",
    ink: "primary-foreground",
  },
  secondary: {
    container: "bg-secondary",
    tone: "onSecondary",
    ink: "secondary-foreground",
  },
  destructive: {
    container: "bg-destructive",
    tone: "onDestructive",
    ink: "destructive-foreground",
  },
} as const;

type ButtonProps = Omit<PressableProps, "children"> & {
  label: string;
  /** A leading symbol, e.g. play or shuffle. */
  icon?: SymbolName;
  variant?: keyof typeof variants;
};

/**
 * A capsule action at the touch height: filled primary, a secondary that is
 * iOS's tinted capsule and Android's tonal button (`secondaryContainer`), or a
 * destructive one. It grows with its text.
 */
export function Button({
  label,
  icon,
  variant = "primary",
  className,
  ...props
}: ButtonProps) {
  const { container, tone, ink } = variants[variant];
  const inkColor = useTokenColor(ink);

  return (
    <Pressable
      accessibilityRole="button"
      className={cx(
        "min-h-touch flex-row items-center justify-center gap-2 rounded-full px-6 py-2 active:opacity-80",
        container,
        className,
      )}
      {...props}
    >
      {icon ? <Icon name={icon} size="md" color={inkColor} /> : null}
      <Text variant="label" tone={tone}>
        {label}
      </Text>
    </Pressable>
  );
}
