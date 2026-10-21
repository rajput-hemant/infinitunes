import { toCardItem, uniqueBy } from "@infinitunes/types";
import type { TopSearch } from "@infinitunes/types";
import { useQuery } from "@tanstack/react-query";
import { Pressable, View } from "react-native";

import { MediaRow } from "~/components/media-row";
import { ScreenScrollView } from "~/components/screen-scroll-view";
import { SongListSkeleton } from "~/components/skeletons";
import { TEXT_BUTTON_HIT_SLOP } from "~/components/ui/hit-slop";
import { Icon } from "~/components/ui/icon";
import { Text } from "~/components/ui/text";
import { trpc } from "~/lib/trpc";
import { useOpenEntity } from "~/navigation/use-open-entity";

import { useSearchHistory } from "./search-history";

type IdleSearchProps = {
  /** Searches for a recent query again. */
  onSelectRecent: (query: string) => void;
};

const selectTopSearches = (items: TopSearch[]) =>
  uniqueBy(items, (item) => item.id).map(toCardItem);

function RecentSearches({ onSelectRecent }: IdleSearchProps) {
  const { queries, clear } = useSearchHistory();
  if (queries.length === 0) return null;

  return (
    <View className="py-3">
      <View className="flex-row items-center justify-between px-page pb-1">
        <Text variant="title" accessibilityRole="header">
          Recent Searches
        </Text>
        <Pressable
          onPress={clear}
          accessibilityRole="button"
          accessibilityLabel="Clear recent searches"
          hitSlop={TEXT_BUTTON_HIT_SLOP}
        >
          <Text variant="subhead" tone="muted">
            Clear
          </Text>
        </Pressable>
      </View>
      {queries.map((query) => (
        <Pressable
          key={query}
          onPress={() => onSelectRecent(query)}
          accessibilityRole="button"
          accessibilityLabel={`Search for ${query}`}
          className="min-h-row flex-row items-center gap-3 px-page py-1 active:opacity-70"
        >
          <Icon name={{ ios: "clock", android: "history" }} size={20} />
          <Text numberOfLines={1} className="flex-1">
            {query}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function TopSearches() {
  const openEntity = useOpenEntity();
  const { data, isPending } = useQuery({
    ...trpc.search.top.queryOptions(),
    select: selectTopSearches,
  });

  // A discovery list: when it fails or is empty the section is left out.
  if (isPending) return <SongListSkeleton rows={5} />;
  if (!data?.length) return null;

  return (
    <View className="py-3">
      <Text variant="title" accessibilityRole="header" className="px-page pb-1">
        Top Searches
      </Text>
      {data.map((item) => (
        <MediaRow
          key={item.id}
          title={item.name}
          subtitle={item.subtitle}
          image={item.image}
          onPress={() => openEntity(item.type, item.url)}
        />
      ))}
    </View>
  );
}

/** What the screen shows before a query: recent searches and the catalog's top searches. */
export function IdleSearch({ onSelectRecent }: IdleSearchProps) {
  return (
    <ScreenScrollView
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      <RecentSearches onSelectRecent={onSelectRecent} />
      <TopSearches />
    </ScreenScrollView>
  );
}
