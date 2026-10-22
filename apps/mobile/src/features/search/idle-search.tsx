import { toCardItem, uniqueBy } from "@infinitunes/types";
import type { TopSearch } from "@infinitunes/types";
import { useQuery } from "@tanstack/react-query";
import { View } from "react-native";

import { ListRow } from "~/components/list-row";
import { isRoundType } from "~/components/media-card";
import { MediaRow } from "~/components/media-row";
import { ScreenScrollView } from "~/components/screen-scroll-view";
import { SectionHeader } from "~/components/section-header";
import {
  SectionHeaderSkeleton,
  SongListSkeleton,
} from "~/components/skeletons";
import { trpc } from "~/lib/trpc";
import { useOpenEntity } from "~/navigation/use-open-entity";

import { kindLabel } from "./result-subtitle";
import { useSearchHistory } from "./search-history";

type IdleSearchProps = {
  /** Searches for a recent query again. */
  onSelectRecent: (query: string) => void;
};

const RECENT_ICON = { ios: "clock", android: "history" } as const;

const selectTopSearches = (items: TopSearch[]) =>
  uniqueBy(items, (item) => item.id).map(toCardItem);

function RecentSearches({ onSelectRecent }: IdleSearchProps) {
  const { queries, clear } = useSearchHistory();
  if (queries.length === 0) return null;

  return (
    <View>
      <SectionHeader
        title="Recent Searches"
        action={{
          label: "Clear",
          onPress: clear,
          accessibilityLabel: "Clear recent searches",
        }}
      />
      {queries.map((query) => (
        <ListRow
          key={query}
          title={query}
          leading={{ icon: RECENT_ICON }}
          onPress={() => onSelectRecent(query)}
          accessibilityLabel={`Search for ${query}`}
        />
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
  if (isPending) {
    return (
      <>
        <SectionHeaderSkeleton />
        <SongListSkeleton rows={8} />
      </>
    );
  }
  if (!data?.length) return null;

  // Upstream's subtitle is the raw type ("song"): name the kind instead and
  // draw artists round, like every other list.
  return (
    <View>
      <SectionHeader title="Top Searches" />
      {data.map((item) => (
        <MediaRow
          key={item.id}
          title={item.name}
          subtitle={kindLabel(item.type)}
          image={item.image}
          round={isRoundType(item.type)}
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
