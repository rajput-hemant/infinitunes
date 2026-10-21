import { MenuView } from "@expo/ui/community/menu";
import { View } from "react-native";

import { Icon } from "~/components/ui/icon";
import { Text } from "~/components/ui/text";

import { isSongSort, SONG_SORTS, type SongSort } from "./song-order";

type SortMenuProps = {
  sort: SongSort;
  onChange: (sort: SongSort) => void;
  /** What the list's own order is called ("Recently played"). */
  recentLabel: string;
};

/** The platform menu that picks how a song list is ordered. */
export function SortMenu({ sort, onChange, recentLabel }: SortMenuProps) {
  const labels: Record<SongSort, string> = {
    recent: recentLabel,
    title: "Title A-Z",
    artist: "Artist A-Z",
  };

  return (
    <MenuView
      title="Sort"
      actions={SONG_SORTS.map((option) => ({
        id: option,
        title: labels[option],
        state: option === sort ? "on" : "off",
      }))}
      onPressAction={({ nativeEvent }) => {
        if (isSongSort(nativeEvent.event)) onChange(nativeEvent.event);
      }}
    >
      <View
        accessibilityRole="button"
        accessibilityLabel={`Sort songs, ${labels[sort]}`}
        className="min-h-ctl flex-row items-center gap-1"
      >
        <Text variant="subhead" tone="muted">
          {labels[sort]}
        </Text>
        <Icon
          name={{ ios: "chevron.up.chevron.down", android: "unfold_more" }}
          size={12}
        />
      </View>
    </MenuView>
  );
}
