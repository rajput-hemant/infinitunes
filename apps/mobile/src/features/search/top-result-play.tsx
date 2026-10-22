import { decode } from "@infinitunes/types";
import type { SearchItem } from "@infinitunes/types";

import { IconButton } from "~/components/ui/icon-button";
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
    <IconButton
      icon={{ ios: "play.fill", android: "play_arrow" }}
      label={`Play ${decode(item.title)}`}
      variant="filled"
      large
      onPress={() => void run(() => playEntity(type, url))}
      disabled={pending}
    />
  );
}
