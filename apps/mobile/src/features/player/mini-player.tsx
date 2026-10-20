import { selectionAsync } from "expo-haptics";
import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";

import { Icon } from "~/components/ui/icon";
import { Text } from "~/components/ui/text";

/**
 * The compact player: what is playing, and a tap target that opens the full
 * player. It draws no background of its own; the host (tab bar accessory or
 * floating dock) supplies the platform material.
 */
export function MiniPlayer() {
  const router = useRouter();

  const openPlayer = () => {
    void selectionAsync();
    router.push("/player");
  };

  return (
    <Pressable
      onPress={openPlayer}
      accessibilityRole="button"
      accessibilityLabel="Open player"
      className="flex-1 flex-row items-center gap-3 px-4"
    >
      <View className="size-9 items-center justify-center rounded-sm bg-muted">
        <Icon name={{ ios: "music.note", android: "music_note" }} size={18} />
      </View>
      <Text variant="subhead" numberOfLines={1} className="flex-1">
        Not playing
      </Text>
      <Icon name={{ ios: "play.fill", android: "play_arrow" }} />
    </Pressable>
  );
}
