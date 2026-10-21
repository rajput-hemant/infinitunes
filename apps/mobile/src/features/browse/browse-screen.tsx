import { LANGUAGES } from "@infinitunes/types";
import { languageLabel } from "@infinitunes/types";
import { Stack } from "expo-router";
import type { Href } from "expo-router";
import { RefreshControl, View } from "react-native";

import { ScreenScrollView } from "~/components/screen-scroll-view";
import { Text } from "~/components/ui/text";
import { GRID_GAP, useGridCardWidth } from "~/lib/use-grid-card-width";
import { entityHref } from "~/navigation/entity-href";

import { BrowseTile } from "./browse-tile";
import { useCategoryCovers } from "./use-category-covers";

type Category = { label: string; href: Href; image?: string };

/** Categories, then every language: each tile opens a list. Pull to refresh the covers. */
export function BrowseScreen() {
  const width = useGridCardWidth();
  const { covers, refreshing, refresh } = useCategoryCovers();
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
    <ScreenScrollView
      contentContainerClassName="gap-6 px-page pt-2"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void refresh()}
        />
      }
    >
      <Stack.Screen options={{ title: "Browse" }} />
      <Text tone="muted">Explore by category, language or mood.</Text>

      <View className="flex-row flex-wrap" style={{ gap: GRID_GAP }}>
        {categories.map((category, index) => (
          <BrowseTile
            key={category.label}
            href={category.href}
            title={category.label}
            image={category.image}
            index={index}
            width={width}
          />
        ))}
      </View>

      <View className="gap-3">
        <Text variant="title" accessibilityRole="header">
          Languages
        </Text>
        <View className="flex-row flex-wrap" style={{ gap: GRID_GAP }}>
          {LANGUAGES.map((lang, index) => (
            <BrowseTile
              key={lang}
              href={{ pathname: "/album", params: { lang } }}
              title={languageLabel(lang)}
              index={index}
              width={width}
            />
          ))}
        </View>
      </View>
    </ScreenScrollView>
  );
}
