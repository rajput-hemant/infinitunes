import { View } from "react-native";

import { Text } from "./ui/text";

/** The "E" mark beside an explicit title (the web's explicit `Badge`). */
export function ExplicitBadge() {
  return (
    <View
      accessible
      accessibilityLabel="Explicit"
      className="rounded-sm bg-muted px-1"
    >
      <Text variant="caption" className="font-bold">
        E
      </Text>
    </View>
  );
}
