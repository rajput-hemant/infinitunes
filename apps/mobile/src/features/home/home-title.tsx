import { Platform, View } from "react-native";

import { Text } from "~/components/ui/text";

import { useHomeGreeting } from "./home-header";

/**
 * Android's Home opens with the greeting as the page's display title (the
 * bar carries only Settings and the profile); iOS titles the bar instead, so
 * it renders nothing there.
 */
export function HomeTitle() {
  const greeting = useHomeGreeting();
  if (Platform.OS !== "android") return null;
  return (
    <View className="px-page pt-2">
      <Text variant="largeTitle" emphasized accessibilityRole="header">
        {greeting}
      </Text>
    </View>
  );
}
