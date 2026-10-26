import type { Queue, RowExtras } from "@infinitunes/types";
import type { ReactNode } from "react";
import { Platform } from "react-native";

import {
  LongPressMenu,
  menuAccessibilityActions,
} from "~/components/context-menu";
import { ListRow } from "~/components/list-row";
import { NativeMenu } from "~/components/native-menu";
import { useSongMenuEntries } from "~/components/song-menu";

import { SwipeToRemove } from "./swipe-remove";

/** A queue entry and the row extras its menu reads (the album). */
type QueueTrack = Queue & RowExtras;

type QueueRowProps = {
  song: QueueTrack;
  onPress: () => void;
  onRemove: () => void;
  /** The row's end: the caller's drag handle, inside the row's pressed highlight. */
  children?: ReactNode;
};

/**
 * An Up next row: the song, then the caller's drag handle (the row's
 * `trailing`, so the pressed highlight spans the whole row). A long press
 * opens the song's menu (`useSongMenuEntries`, with Remove from Queue).
 *
 * iOS uses the system context menu of `@expo/ui`'s `MenuView`
 * (`shouldOpenOnLongPress`), one host per row of this short list, not the
 * link's `Link.Menu`: the queue lives in the Now Playing modal beside a
 * reorderable list and pan gestures, where the link's preview menu never
 * showed. Android's dropdown mounts on the first long press. The entries are
 * also the row's screen reader actions.
 */
export function QueueRow({ song, onPress, onRemove, children }: QueueRowProps) {
  const entries = useSongMenuEntries({
    song,
    inQueue: true,
    removal: { title: "Remove from Queue", onRemove },
  });

  const row = (onLongPress?: () => void) => (
    <ListRow
      title={song.name}
      subtitle={song.subtitle}
      explicit={song.explicit}
      leading={{ artwork: song.image }}
      trailing={children}
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityLabel={song.name}
      accessibilityValue={{
        text: [song.explicit && "Explicit", song.subtitle]
          .filter(Boolean)
          .join(", "),
      }}
      accessibilityHint="Plays this song"
      {...menuAccessibilityActions(entries)}
    />
  );

  const menu =
    Platform.OS === "ios" ? (
      <NativeMenu
        title={song.name}
        entries={entries}
        openOnLongPress
        testID={`queue-row-menu-${song.id}`}
        style={{ width: "100%" }}
      >
        {row()}
      </NativeMenu>
    ) : (
      <LongPressMenu
        testID="queue-row-menu"
        renderMenu={(options, anchor) => (
          <NativeMenu title={song.name} entries={entries} {...options}>
            {anchor}
          </NativeMenu>
        )}
      >
        {(onLongPress) => row(onLongPress)}
      </LongPressMenu>
    );
  return <SwipeToRemove onRemove={onRemove}>{menu}</SwipeToRemove>;
}
