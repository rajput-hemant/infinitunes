import { useTheme } from "expo-router";
import type { SymbolViewProps } from "expo-symbols";
import { Pressable } from "react-native";
import type { PressableProps } from "react-native";

import { cx } from "~/lib/class-names";

import { Icon } from "./icon";
import { Text } from "./text";

const variants = {
  primary: { container: "bg-primary", tone: "onPrimary" },
  secondary: { container: "bg-secondary", tone: "default" },
  destructive: { container: "bg-destructive", tone: "onDestructive" },
} as const;

type ButtonProps = Omit<PressableProps, "children"> & {
  label: string;
  /** A leading symbol, e.g. play or shuffle. */
  icon?: SymbolViewProps["name"];
  variant?: keyof typeof variants;
};

/** An action at the prominent control height: filled primary, a tinted secondary, or a destructive one. */
export function Button({
  label,
  icon,
  variant = "primary",
  className,
  ...props
}: ButtonProps) {
  const { colors } = useTheme();
  const { container, tone } = variants[variant];

  return (
    <Pressable
      accessibilityRole="button"
      className={cx(
        "min-h-touch flex-row items-center justify-center gap-2 rounded-lg px-5 py-2 active:opacity-80",
        container,
        className,
      )}
      {...props}
    >
      {icon ? (
        <Icon
          name={icon}
          size={18}
          color={variant === "secondary" ? undefined : colors.background}
        />
      ) : null}
      <Text variant="headline" tone={tone}>
        {label}
      </Text>
    </Pressable>
  );
}
