import { toCardItem, uniqueBy } from "@infinitunes/types";
import type { Chart } from "@infinitunes/types";
import { useQuery } from "@tanstack/react-query";
import { Stack } from "expo-router";

import { CatalogScreen } from "~/components/catalog-screen";
import { MediaCard } from "~/components/media-card";
import { Text } from "~/components/ui/text";
import { CATALOG_PAGE_SIZE } from "~/features/browse/catalog-page-size";
import { trpc } from "~/lib/trpc";

const selectCharts = (charts: Chart[]) => uniqueBy(charts, (chart) => chart.id);

/** The top charts; upstream answers with one page, so there is no paging. */
export function TopChartsScreen() {
  const charts = useQuery({
    ...trpc.get.charts.queryOptions({ page: 1, n: CATALOG_PAGE_SIZE }),
    select: selectCharts,
  });

  return (
    <>
      <Stack.Screen options={{ title: "Top Charts" }} />
      <CatalogScreen
        query={{ ...charts, items: charts.data ?? [] }}
        keyOf={(chart) => chart.id}
        renderCard={(chart, width) => (
          <MediaCard item={toCardItem(chart)} width={width} />
        )}
        empty={{
          icon: { ios: "chart.bar", android: "bar_chart" },
          title: "No charts yet",
          message: "Charts are updated regularly. Check back soon.",
        }}
        header={
          <Text tone="muted" className="px-page pb-2 pt-2">
            Updated every Friday.
          </Text>
        }
      />
    </>
  );
}
