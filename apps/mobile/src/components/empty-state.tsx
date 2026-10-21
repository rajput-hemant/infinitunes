import type { SymbolViewProps } from "expo-symbols";
import { View } from "react-native";

import { Button } from "./ui/button";
import { Icon } from "./ui/icon";
import { Text } from "./ui/text";

type EmptyStateProps = {
  icon: SymbolViewProps["name"];
  title: string;
  message?: string;
  action?: { label: string; onPress: () => void };
};

/** A centred notice for an empty list or screen, with an optional way forward. */
export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center gap-3 px-page py-10">
      <Icon name={icon} size={40} />
      <Text variant="headline" className="text-center">
        {title}
      </Text>
      {message ? (
        <Text tone="muted" className="text-center">
          {message}
        </Text>
      ) : null}
      {action ? (
        <Button
          label={action.label}
          onPress={action.onPress}
          className="mt-2"
        />
      ) : null}
    </View>
  );
}
