import { router, Stack } from "expo-router";
import { View } from "react-native";

import { EmptyState } from "~/components/empty-state";

/** A link the app has no screen for (an old or foreign URL): one way home. */
export default function NotFound() {
  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: "Not found" }} />
      <EmptyState
        icon={{ ios: "music.note", android: "music_note" }}
        title="This page isn't here"
        message="The link may be old, or the item is no longer available."
        action={{ label: "Go home", onPress: () => router.replace("/") }}
      />
    </View>
  );
}
