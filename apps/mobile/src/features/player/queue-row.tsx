import type { Queue, RowExtras } from "@infinitunes/types";
import { useEffect, useRef, useState } from "react";
import type { ReactElement, ReactNode } from "react";
import { View } from "react-native";

import {
  ContextLink,
  LINK_MENUS,
  LongPressMenu,
  menuAccessibilityActions,
} from "~/components/context-menu";
import { ListRow } from "~/components/list-row";
import { NativeMenu } from "~/components/native-menu";
import { songPreview, useSongMenuEntries } from "~/components/song-menu";
import { entityHref } from "~/navigation/entity-href";
import { usePalette } from "~/theme/use-palette";
import { useRadii } from "~/theme/use-radii";

/** A queue entry and the row extras its menu reads (the album). */
type QueueTrack = Queue & RowExtras;

type QueueRowProps = {
  song: QueueTrack;
  onPress: () => void;
  onRemove: () => void;
  /** The row's end: the caller's drag handle, inside the lifted region. */
  children?: ReactNode;
};

/** How long a touch rests before iOS lifts the row (the system's long press is about 0.5s). */
const LIFT_AFTER_MS = 250;
/** The lift's snapshot is taken by then; the row sits plain again. */
const LIFT_FOR_MS = 1500;

/**
 * The whole row, handle included, is what iOS lifts for the context menu, and
 * the system snapshots whatever the view paints: over the player's wash that
 * is a see-through row. While a touch rests, the row paints an opaque card
 * with its corners.
 */
function LiftableRow({ children }: { children: ReactNode }) {
  const palette = usePalette();
  const radius = useRadii().lg;
  const [lifted, setLifted] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clear = () => {
    for (const timer of timers.current) clearTimeout(timer);
    timers.current = [];
  };
  // Unmounting mid-touch must not set state later.
  useEffect(
    () => () => {
      for (const timer of timers.current) clearTimeout(timer);
    },
    [],
  );

  function begin() {
    clear();
    timers.current = [
      setTimeout(() => setLifted(true), LIFT_AFTER_MS),
      setTimeout(() => setLifted(false), LIFT_AFTER_MS + LIFT_FOR_MS),
    ];
  }
  function end() {
    clear();
    setLifted(false);
  }

  return (
    <View
      testID="queue-row"
      className="flex-row items-center pr-2"
      style={
        lifted
          ? { backgroundColor: palette.card, borderRadius: radius }
          : undefined
      }
      onTouchStart={begin}
      onTouchEnd={end}
      onTouchCancel={end}
    >
      {children}
    </View>
  );
}

/**
 * An Up next row: the song, then the caller's drag handle. A long press
 * anywhere on it opens the song's context menu (`useSongMenuEntries`, with
 * Remove from Queue): iOS's with the shared song preview (the link's own
 * context menu around the whole row; a tap still plays, the preview opens the
 * song), Android's dropdown, mounted on the first long press. Its entries are
 * also the row's screen reader actions.
 */
export function QueueRow({ song, onPress, onRemove, children }: QueueRowProps) {
  const entries = useSongMenuEntries({
    song,
    inQueue: true,
    removal: { title: "Remove from Queue", onRemove },
  });
  const href = entityHref(song.type, song.url);

  const row = (onLongPress?: () => void) => (
    <LiftableRow>
      <View className="flex-1">
        <ListRow
          title={song.name}
          subtitle={song.subtitle}
          explicit={song.explicit}
          leading={{ artwork: song.image }}
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
      </View>
      {children}
    </LiftableRow>
  );

  if (LINK_MENUS && href) {
    return (
      <ContextLink
        href={href}
        entries={entries}
        preview={songPreview(song)}
        tapOpens={false}
      >
        {(wrap) => wrap(row() as ReactElement)}
      </ContextLink>
    );
  }
  return (
    <LongPressMenu
      testID="queue-row-menu"
      renderMenu={(ref, anchor) => (
        <NativeMenu title={song.name} entries={entries} ref={ref}>
          {anchor}
        </NativeMenu>
      )}
    >
      {(onLongPress) => row(onLongPress)}
    </LongPressMenu>
  );
}
