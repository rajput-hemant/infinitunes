import { Platform, View } from "react-native";

import { art, space } from "~/theme/tokens";
import { usePalette } from "~/theme/use-palette";

import { Button } from "./ui/button";
import { Icon } from "./ui/icon";
import type { SymbolName } from "./ui/icon";
import { Text } from "./ui/text";

type EmptyStateProps = {
  icon: SymbolName;
  title: string;
  message?: string;
  /** One way forward (primary), or a retry (`variant: "secondary"`). */
  action?: {
    label: string;
    onPress: () => void;
    variant?: "primary" | "secondary";
  };
  /**
   * `top` in a sheet: a sheet lays its content out at its largest detent, so
   * a centred notice would sit below the fold of the smaller one.
   */
  placement?: "center" | "top";
};

/** A centred notice for an empty list or screen, with an optional way forward. */
export function EmptyState({
  icon,
  title,
  message,
  action,
  placement = "center",
}: EmptyStateProps) {
  const palette = usePalette();
  // Android (Material 3 Expressive): the symbol in a tonal extra-large shape,
  // a titleLarge headline.
  const android = Platform.OS === "android";
  return (
    <View
      className={
        placement === "top"
          ? "items-center px-page py-8"
          : "flex-1 items-center justify-center px-page py-12"
      }
    >
      {android ? (
        <View
          className="items-center justify-center rounded-xl bg-secondary"
          style={{ width: art.feature, height: art.feature }}
        >
          <Icon
            name={icon}
            size="xxl"
            color={palette["secondary-foreground"]}
          />
        </View>
      ) : (
        <Icon name={icon} size="xxl" color={palette["muted-foreground"]} />
      )}
      <Text
        variant={android ? "title2" : "headline"}
        emphasized
        className={android ? "mt-6 text-center" : "mt-4 text-center"}
      >
        {title}
      </Text>
      {message ? (
        <Text
          variant="subhead"
          tone="muted"
          className={android ? "mt-2 text-center" : "mt-1 text-center"}
          style={{ maxWidth: 300 }}
        >
          {message}
        </Text>
      ) : null}
      {action ? (
        <Button
          label={action.label}
          onPress={action.onPress}
          variant={action.variant ?? "primary"}
          style={{ marginTop: android ? space.xl : space.lg }}
        />
      ) : null}
    </View>
  );
}
