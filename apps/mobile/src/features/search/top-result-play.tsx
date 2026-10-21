import { decode } from "@infinitunes/types";
import type { SearchItem } from "@infinitunes/types";
import { View } from "react-native";

import { Button } from "~/components/ui/button";
import { usePending } from "~/lib/use-pending";
import { isPlayable, playEntity } from "~/playback/play-entity";

/**
 * The Top Result's Play button (the web's `TopResultCard`): plays the result
 * without opening it. Items without a page of their own (artist names, the
 * query itself) render nothing.
 */
export function TopResultPlay({ item }: { item: SearchItem }) {
  const { run, pending } = usePending();
  const { type, perma_url: url } = item;
  if (!url || !isPlayable(type)) return null;

  return (
    <View className="flex-row px-page pb-2">
      <Button
        label="Play"
        icon={{ ios: "play.fill", android: "play_arrow" }}
        accessibilityLabel={`Play ${decode(item.title)}`}
        onPress={() => void run(() => playEntity(type, url))}
        disabled={pending}
      />
    </View>
  );
}
