import { getErrorCode } from "@infinitunes/core/error-code";
import type { UseQueryResult } from "@tanstack/react-query";
import { Stack } from "expo-router";
import type { SymbolViewProps } from "expo-symbols";
import type { ReactNode } from "react";
import { View } from "react-native";

import { EmptyState } from "~/components/empty-state";
import { ErrorState } from "~/components/error-state";
import type { ShareableItem } from "~/lib/share";

import { detailHeaderOptions } from "./detail-header-options";

const NOT_FOUND_ICON: SymbolViewProps["name"] = {
  ios: "magnifyingglass",
  android: "search_off",
};

export type DetailFrameProps<Data> = {
  /** `null` data is an entity upstream does not have, like a NOT_FOUND error. */
  query: UseQueryResult<Data | null, unknown>;
  /** Mirrors the loaded page while the query is pending. */
  skeleton: ReactNode;
  /** What the page shows, for the not-found title ("Album"). */
  noun: string;
  /** The not-found state's symbol; a magnifying glass by default. */
  icon?: SymbolViewProps["name"];
  /** The loaded item's header title and shared web page. */
  identity: (data: Data) => ShareableItem;
  children: (data: Data) => ReactNode;
};

/**
 * Every entity screen's states: the skeleton while loading, a final
 * not-found or a retryable failure, and the loaded page with the item's name
 * in a small native header title and Share at its trailing edge.
 */
export function DetailFrame<Data>({
  query,
  skeleton,
  noun,
  icon = NOT_FOUND_ICON,
  identity,
  children,
}: DetailFrameProps<Data>) {
  const { data } = query;

  if (data !== undefined && data !== null) {
    return (
      <>
        <Stack.Screen options={detailHeaderOptions(identity(data))} />
        {children(data)}
      </>
    );
  }

  const missing = data === null || getErrorCode(query.error) === "NOT_FOUND";
  return (
    <>
      <Stack.Screen options={detailHeaderOptions()} />
      {query.isPending ? (
        skeleton
      ) : (
        <View className="flex-1">
          {missing ? (
            <EmptyState
              icon={icon}
              title={`${noun} not found`}
              message="It may have been removed."
            />
          ) : (
            <ErrorState
              error={query.error}
              onRetry={() => void query.refetch()}
            />
          )}
        </View>
      )}
    </>
  );
}
