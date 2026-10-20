import { toCardItem } from "@infinitunes/types";
import type { Modules } from "@infinitunes/types";
import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, View } from "react-native";

import { MediaRow } from "~/components/media-row";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { trpc } from "~/lib/trpc";
import { playerDockInset } from "~/navigation/player-dock";

const selectTrending = (modules: Modules) =>
  modules.new_trending.map(toCardItem);

/** Today's trending albums, songs and playlists from the launch data. */
export function TrendingList() {
  const { data, error, isPending, isRefetching, refetch } = useQuery({
    ...trpc.home.home.queryOptions({}),
    select: selectTrending,
  });

  if (isPending) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center gap-4 px-page">
        <Text tone="muted">Could not load trending music.</Text>
        <Button label="Try again" onPress={() => void refetch()} />
      </View>
    );
  }

  return (
    <FlashList
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <MediaRow
          title={item.name}
          subtitle={item.subtitle}
          image={item.image}
        />
      )}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingBottom: playerDockInset }}
      refreshing={isRefetching}
      onRefresh={() => void refetch()}
    />
  );
}
