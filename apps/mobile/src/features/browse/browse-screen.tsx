import { LANGUAGES } from "@infinitunes/types";
import { languageLabel } from "@infinitunes/types";
import { Stack } from "expo-router";
import type { Href } from "expo-router";
import { View } from "react-native";

import { ScreenScrollView } from "~/components/screen-scroll-view";
import { Text } from "~/components/ui/text";
import { entityHref } from "~/navigation/entity-href";

import { BrowseTile } from "./browse-tile";
import { useCategoryCovers } from "./use-category-covers";
import { GRID_GAP, useGridCardWidth } from "./use-grid-card-width";

type Category = { label: string; href: Href; image?: string };

/** Categories, then every language: each tile opens a list. */
export function BrowseScreen() {
  const width = useGridCardWidth();
  const covers = useCategoryCovers();
  const mixHref = covers.mix && entityHref("mix", covers.mix.perma_url);

  const categories: Category[] = [
    { label: "Top Albums", href: "/browse/albums", image: covers.albums },
    { label: "Top Charts", href: "/charts", image: covers.charts },
    {
      label: "Top Playlists",
      href: "/browse/playlists",
      image: covers.playlists,
    },
    { label: "Podcasts", href: "/browse/podcasts", image: covers.shows },
    { label: "Top Artists", href: "/browse/artists", image: covers.artists },
    { label: "Radio", href: "/radio", image: covers.stations },
    {
      label: "New Releases",
      href: "/browse/albums",
      image: covers.newReleases,
    },
    ...(covers.mix && mixHref
      ? [{ label: "Made for you", href: mixHref, image: covers.mix.image }]
      : []),
  ];

  return (
    <ScreenScrollView contentContainerClassName="gap-6 px-page pt-2">
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
              href={{ pathname: "/browse/albums", params: { lang } }}
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
