import { getErrorCode } from "@infinitunes/core/error-code";
import type { UseQueryResult } from "@tanstack/react-query";
import { Stack } from "expo-router";
import type { SymbolViewProps } from "expo-symbols";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { View } from "react-native";
import Animated, { useSharedValue } from "react-native-reanimated";

import { EmptyState } from "~/components/empty-state";
import { ErrorState } from "~/components/error-state";
import { CONTENT_REVEAL } from "~/components/skeletons";
import type { ShareableItem } from "~/lib/share";

import { detailHeaderOptions } from "./detail-header-options";
import { DetailMenuContext } from "./detail-menu";
import type { HeaderMenu } from "./detail-menu";
import { DetailScrollContext, useBarInset } from "./detail-scroll";

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
 * in a small native header title, with Share and the page's "more" menu
 * (`DetailMenu`) at its trailing edge. The page's
 * scroll view reports scrolling under the bar through `useDetailScrollProps`
 * (the titled bar, and Android's scrim over the wash under its transparent
 * bar). Every state is in the scroll context, so skeletons pad the same.
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
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState<HeaderMenu>();
  const offset = useSharedValue(0);
  const scroll = useMemo(() => ({ setScrolled, offset }), [offset]);

  return (
    <DetailScrollContext value={scroll}>
      {data !== undefined && data !== null ? (
        <DetailMenuContext value={setMenu}>
          <Stack.Screen
            options={detailHeaderOptions(
              identity(data),
              scrolled,
              menu,
              offset,
            )}
          />
          <Animated.View entering={CONTENT_REVEAL} className="flex-1">
            {children(data)}
          </Animated.View>
        </DetailMenuContext>
      ) : (
        <>
          <Stack.Screen
            options={detailHeaderOptions(undefined, false, undefined, offset)}
          />
          {query.isPending ? (
            skeleton
          ) : (
            <Unavailable query={query} noun={noun} icon={icon} />
          )}
        </>
      )}
    </DetailScrollContext>
  );
}

/** Not found or failed, clear of Android's transparent bar. */
function Unavailable({
  query,
  noun,
  icon,
}: Pick<DetailFrameProps<unknown>, "query" | "noun"> & {
  icon: SymbolViewProps["name"];
}) {
  const missing =
    query.data === null || getErrorCode(query.error) === "NOT_FOUND";
  return (
    <View className="flex-1" style={{ paddingTop: useBarInset() }}>
      {missing ? (
        <EmptyState
          icon={icon}
          title={`${noun} not found`}
          message="It may have been removed."
        />
      ) : (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      )}
    </View>
  );
}
