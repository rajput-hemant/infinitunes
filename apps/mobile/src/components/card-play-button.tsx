import type { StyleProp, ViewStyle } from "react-native";
import { Platform } from "react-native";

import { usePending } from "~/lib/use-pending";
import { playEntity, type PlayableType } from "~/playback/play-entity";
import { useRadii } from "~/theme/use-radii";

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
 * The Play control (a round 48pt button on iOS, Material 3's filled icon button, a rounded square at rest, on Android) of a hero card (the web's `CardPlay`): it
 * queues the item's tracks, or tunes in a station, without opening its
 * screen. Render it as a sibling of the card's link, never inside it, so both
 * stay reachable.
 */
export function CardPlayButton({
  type,
  url,
  name,
  style,
}: CardPlayButtonProps) {
  const { run, pending } = usePending();

  const { md } = useRadii();
  // Android: Material 3 Expressive's filled icon button, at rest a rounded
  // square (its corners still morph while pressed); iOS: a round one.
  return (
    <IconButton
      icon={{ ios: "play.fill", android: "play_arrow" }}
      label={`Play ${name}`}
      variant="filled"
      onPress={() => void run(() => playEntity(type, url))}
      busy={pending}
      size="md"
      restRadius={Platform.OS === "android" ? md : undefined}
      style={style}
    />
  );
}
