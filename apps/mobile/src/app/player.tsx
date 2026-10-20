import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "~/components/ui/icon";
import { Text } from "~/components/ui/text";

/** The full player, presented as a sheet over the tabs. */
export default function PlayerScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 items-center justify-center gap-6 px-page"
      style={{ paddingBottom: insets.bottom }}
    >
      <View className="aspect-square w-full items-center justify-center rounded-xl bg-muted">
        <Icon name={{ ios: "music.note", android: "music_note" }} size={64} />
      </View>
      <Text variant="title">Not playing</Text>
    </View>
  );
}
