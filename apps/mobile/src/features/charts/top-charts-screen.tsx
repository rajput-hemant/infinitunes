import { toCardItem, uniqueBy } from "@infinitunes/types";
import type { Chart } from "@infinitunes/types";
import { useQuery } from "@tanstack/react-query";
import { Stack } from "expo-router";

import { CatalogScreen } from "~/components/catalog-screen";
import { MediaCard } from "~/components/media-card";
import { Text } from "~/components/ui/text";
import { useCatalogLang } from "~/lib/preferences";
import { trpc } from "~/lib/trpc";
import { CATALOG_PAGE_SIZE } from "~/lib/use-infinite-list";

import { singlePage } from "../single-page";

const selectCharts = (charts: Chart[]) => uniqueBy(charts, (chart) => chart.id);

/** The top charts; upstream answers with one page, so there is no paging. */
export function TopChartsScreen() {
  const lang = useCatalogLang();
  const charts = useQuery({
    ...trpc.get.charts.queryOptions({ page: 1, n: CATALOG_PAGE_SIZE, lang }),
    select: selectCharts,
  });

  return (
    <>
      <Stack.Screen options={{ title: "Top Charts" }} />
      <CatalogScreen
        query={singlePage(charts)}
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
          <Text variant="subhead" tone="muted" className="px-page py-2">
            Updated every Friday.
          </Text>
        }
      />
    </>
  );
}
