import { View } from "react-native";

import { Text } from "./ui/text";

/**
 * Upstream's `explicit_content` flag: "1" (or "true" from some list
 * endpoints) marks explicit content, "0" or nothing does not.
 */
export function isExplicit(flag: string | undefined): boolean {
  return flag === "true" || Number(flag) > 0;
}

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
