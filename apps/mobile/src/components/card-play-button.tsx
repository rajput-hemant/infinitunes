import { useTheme } from "expo-router";
import type { StyleProp, ViewStyle } from "react-native";
import { View } from "react-native";

import { usePending } from "~/lib/use-pending";
import { playEntity, type PlayableType } from "~/playback/play-entity";

import { IconButton } from "./ui/icon-button";

type CardPlayButtonProps = {
  type: PlayableType;
  url: string;
  /** Decoded title; the control reads "Play <name>". */
  name: string;
  /** Where the round button sits, e.g. over the artwork's corner. */
  style?: StyleProp<ViewStyle>;
};

/**
 * The round Play control of a card (the web's `CardPlay`): it queues the
 * item's tracks, or tunes in a station, without opening its screen. Render it
 * as a sibling of the card's link, never inside it, so both stay reachable.
 */
export function CardPlayButton({
  type,
  url,
  name,
  style,
}: CardPlayButtonProps) {
  const { colors } = useTheme();
  const { run, pending } = usePending();

  return (
    <View className="rounded-full bg-primary" style={style}>
      <IconButton
        icon={{ ios: "play.fill", android: "play_arrow" }}
        label={`Play ${name}`}
        onPress={() => void run(() => playEntity(type, url))}
        disabled={pending}
        size={18}
        color={colors.background}
      />
    </View>
  );
}
