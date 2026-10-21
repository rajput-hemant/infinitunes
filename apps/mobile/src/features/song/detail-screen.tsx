import { getErrorCode } from "@infinitunes/core/error-code";
import { useQueryClient } from "@tanstack/react-query";
import type { QueryKey, UseQueryResult } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useState } from "react";
import type { ReactNode } from "react";
import { RefreshControl, View } from "react-native";

import { EmptyState } from "~/components/empty-state";
import { ErrorState } from "~/components/error-state";
import { ScreenScrollView } from "~/components/screen-scroll-view";
import { IconButton } from "~/components/ui/icon-button";
import { shareItem } from "~/lib/share";

type PageIdentity = {
  /** Decoded title: the header title and the share text. */
  name: string;
  /** The item's perma URL, shared as its web page. */
  url: string;
};

type DetailScreenProps<Data> = {
  /** `null` data is an entity upstream does not have. */
  query: UseQueryResult<Data | null, unknown>;
  /** Mirrors the loaded page (see `DetailSkeleton`). */
  skeleton: ReactNode;
  /** What the page shows, for the not-found copy ("album"). */
  noun: string;
  /** The page's secondary queries, refetched with `query` on pull to refresh. */
  refreshKeys?: readonly QueryKey[];
  identity: (data: Data) => PageIdentity;
  children: (data: Data) => ReactNode;
};

/** The header's share button. A factory, as `headerRight` takes a render function. */
function shareButtonFor({ name, url }: PageIdentity) {
  return () => (
    <IconButton
      icon={{ ios: "square.and.arrow.up", android: "share" }}
      label={`Share ${name}`}
      onPress={() => shareItem({ name, url })}
    />
  );
}

function isNotFound(error: unknown): boolean {
  return getErrorCode(error) === "NOT_FOUND";
}

/**
 * The frame every entity page shares: the skeleton while loading, a
 * not-found or retry state, and the loaded page in a refreshable scroll view
 * with the item's name in the header and a share button beside it.
 */
export function DetailScreen<Data>({
  query,
  skeleton,
  noun,
  refreshKeys = [],
  identity,
  children,
}: DetailScreenProps<Data>) {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    try {
      await Promise.all([
        query.refetch(),
        ...refreshKeys.map((queryKey) =>
          queryClient.refetchQueries({ queryKey }),
        ),
      ]);
    } finally {
      setRefreshing(false);
    }
  }

  const { data } = query;

  if (data === undefined) {
    if (query.isPending) {
      return (
        <ScreenScrollView scrollEnabled={false}>{skeleton}</ScreenScrollView>
      );
    }
    return isNotFound(query.error) ? (
      <MissingState noun={noun} />
    ) : (
      <View className="flex-1">
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </View>
    );
  }
  if (data === null) return <MissingState noun={noun} />;

  const { name, url } = identity(data);

  return (
    <>
      <Stack.Screen
        options={{
          title: name,
          headerRight: shareButtonFor({ name, url }),
        }}
      />
      <ScreenScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void refresh()}
          />
        }
      >
        {children(data)}
      </ScreenScrollView>
    </>
  );
}

function MissingState({ noun }: { noun: string }) {
  return (
    <View className="flex-1">
      <EmptyState
        icon={{ ios: "magnifyingglass", android: "search_off" }}
        title={`Couldn't find this ${noun}`}
        message="It may have been removed."
      />
    </View>
  );
}
