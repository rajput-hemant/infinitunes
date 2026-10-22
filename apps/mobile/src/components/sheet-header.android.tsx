import { View } from "react-native";

import { Text } from "./ui/text";

/**
 * Android's form sheets have no header or grabber: Material 3's bottom
 * sheet drag handle (32 × 4dp, `onSurfaceVariant` at 40%) over a
 * titleLarge title.
 */
export function SheetHeader({ title }: { title: string }) {
  return (
    <View>
      <View className="items-center pt-4">
        <View className="h-1 w-8 rounded-full bg-muted-foreground opacity-40" />
      </View>
      <Text
        variant="title2"
        emphasized
        accessibilityRole="header"
        className="px-page pb-2 pt-4"
      >
        {title}
      </Text>
    </View>
  );
}
