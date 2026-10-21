import { View } from "react-native";

import { Text } from "./ui/text";

/** The "E" mark leading an explicit item's subtitle (the web's explicit `Badge`). */
export function ExplicitBadge() {
  return (
    <View
      accessible
      accessibilityLabel="Explicit"
      className="rounded-xs bg-muted px-1"
    >
      <Text variant="caption">E</Text>
    </View>
  );
}
