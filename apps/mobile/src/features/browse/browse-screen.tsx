import { LANGUAGES } from "@infinitunes/types";
import { languageLabel } from "@infinitunes/types";
import { Stack } from "expo-router";
import type { Href } from "expo-router";
import { View } from "react-native";

import { ScreenScrollView } from "~/components/screen-scroll-view";
import { SectionHeader } from "~/components/section-header";
import { PullToRefresh } from "~/components/ui/refresh-control";
import { Text } from "~/components/ui/text";
import { GRID_GAP, useGridCardWidth } from "~/lib/use-grid-card-width";
import { entityHref } from "~/navigation/entity-href";

import { BrowseTile } from "./browse-tile";
import { useCategoryCovers } from "./use-category-covers";

type Category = { label: string; href: Href; image?: string };

/** Categories, then every language: each tile opens a list. Pull to refresh the covers. */
export function BrowseScreen() {
  const width = useGridCardWidth();
  const { covers, refresh } = useCategoryCovers();
  const mixHref = covers.mix && entityHref("mix", covers.mix.perma_url);

  const categories: Category[] = [
    { label: "Top Albums", href: "/album", image: covers.albums },
    { label: "Top Charts", href: "/chart", image: covers.charts },
    {
      label: "Top Playlists",
      href: "/playlist",
      image: covers.playlists,
    },
    { label: "Podcasts", href: "/show", image: covers.shows },
    { label: "Top Artists", href: "/artist", image: covers.artists },
    { label: "Radio", href: "/radio", image: covers.stations },
    {
      label: "New Releases",
      href: "/album",
      image: covers.newReleases,
    },
    ...(covers.mix && mixHref
      ? [{ label: "Made for you", href: mixHref, image: covers.mix.image }]
      : []),
  ];

  return (
    <ScreenScrollView refreshControl={<PullToRefresh onRefresh={refresh} />}>
      <Stack.Screen options={{ title: "Browse" }} />
      <Text variant="subhead" tone="muted" className="px-page pb-2">
        Explore by category, language or mood.
      </Text>

      <View className="flex-row flex-wrap px-page" style={{ gap: GRID_GAP }}>
        {categories.map((category) => (
          <BrowseTile
            key={category.label}
            href={category.href}
            title={category.label}
            image={category.image}
            width={width}
          />
        ))}
      </View>

      <SectionHeader title="Languages" />
      <View className="flex-row flex-wrap px-page" style={{ gap: GRID_GAP }}>
        {LANGUAGES.map((lang) => (
          <BrowseTile
            key={lang}
            href={{ pathname: "/album", params: { lang } }}
            title={languageLabel(lang)}
            width={width}
          />
        ))}
      </View>
    </ScreenScrollView>
  );
}
