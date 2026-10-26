import { use } from "react";
import { StyleSheet, View } from "react-native";

import { Text, TextInkContext } from "./ui/text";

type ExplicitBadgeProps = {
  /**
   * Its own "Explicit" element for screen readers. Pass `false` inside a
   * row or card whose label already says "Explicit", or TalkBack reads it twice.
   */
  accessible?: boolean;
};

/** The "E" mark leading an explicit item's subtitle (the web's explicit `Badge`). */
export function ExplicitBadge({ accessible = true }: ExplicitBadgeProps) {
  // On a recoloured surface the `muted` fill is unchecked: a hairline in its muted ink.
  const ink = use(TextInkContext);
  return (
    <View
      accessible={accessible}
      accessibilityLabel={accessible ? "Explicit" : undefined}
      accessibilityElementsHidden={!accessible}
      importantForAccessibility={accessible ? "auto" : "no-hide-descendants"}
      className={ink ? "rounded-xs px-1" : "rounded-xs bg-muted px-1"}
      style={
        ink
          ? { borderWidth: StyleSheet.hairlineWidth, borderColor: ink.muted }
          : undefined
      }
    >
      <Text variant="caption" tone={ink ? "muted" : "default"}>
        E
      </Text>
    </View>
  );
}
