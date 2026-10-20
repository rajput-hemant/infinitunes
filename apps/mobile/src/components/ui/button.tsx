import { Pressable } from "react-native";
import type { PressableProps } from "react-native";

import { cx } from "~/lib/class-names";

import { Text } from "./text";

type ButtonProps = Omit<PressableProps, "children"> & {
  label: string;
};

/** A filled primary action at the prominent control height. */
export function Button({ label, className, ...props }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      className={cx(
        "h-ctl-lg items-center justify-center rounded-lg bg-primary px-5 active:opacity-80",
        className,
      )}
      {...props}
    >
      <Text variant="headline" tone="onPrimary">
        {label}
      </Text>
    </Pressable>
  );
}
