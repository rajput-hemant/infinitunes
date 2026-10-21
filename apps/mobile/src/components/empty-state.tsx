import { View } from "react-native";

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
};

/** A centred notice for an empty list or screen, with an optional way forward. */
export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  const palette = usePalette();
  return (
    <View className="flex-1 items-center justify-center px-page py-12">
      <Icon name={icon} size="xxl" color={palette["muted-foreground"]} />
      <Text variant="headline" className="mt-4 text-center">
        {title}
      </Text>
      {message ? (
        <Text
          variant="subhead"
          tone="muted"
          className="mt-1 text-center"
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
          className="mt-4"
        />
      ) : null}
    </View>
  );
}
