import { View } from "react-native";

import { Text } from "./ui/text";

type ExplicitBadgeProps = {
  /**
   * Its own "Explicit" element for screen readers. Pass `false` inside a
   * row or card whose label already says "Explicit", or TalkBack reads it twice.
   */
  accessible?: boolean;
};

/** The "E" mark leading an explicit item's subtitle (the web's explicit `Badge`). */
export function ExplicitBadge({ accessible = true }: ExplicitBadgeProps) {
  return (
    <View
      accessible={accessible}
      accessibilityLabel={accessible ? "Explicit" : undefined}
      accessibilityElementsHidden={!accessible}
      importantForAccessibility={accessible ? "auto" : "no-hide-descendants"}
      className="rounded-xs bg-muted px-1"
    >
      <Text variant="caption">E</Text>
    </View>
  );
}
