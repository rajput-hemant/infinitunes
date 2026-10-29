import { Platform, View } from "react-native";

import { Text } from "./ui/text";

/**
 * Android's display title for a root screen, drawn in the page (the bar keeps
 * only Settings and the profile; pair it with `useTopLevelHeaderOptions`'s
 * `titleInPage`). iOS titles the bar instead, so it renders nothing there.
 */
export function PageTitle({ title }: { title: string }) {
  if (Platform.OS !== "android") return null;
  return (
    <View className="px-page pt-2">
      <Text variant="largeTitle" emphasized accessibilityRole="header">
        {title}
      </Text>
    </View>
  );
}
