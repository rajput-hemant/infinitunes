import type { CardItem } from "@infinitunes/types";
import { Link } from "expo-router";
import { Pressable, View } from "react-native";

import { MediaCard } from "~/components/media-card";
import { Artwork } from "~/components/ui/artwork";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { GRID_GAP, useGridCardWidth } from "~/lib/use-grid-card-width";
import { usePending } from "~/lib/use-pending";
import { entityHref } from "~/navigation/entity-href";
import { isPlayable, playEntity } from "~/playback/play-entity";
import { radii } from "~/theme/tokens";

type HomeHeroProps = {
  featured: CardItem;
  tiles: readonly CardItem[];
};

/** The featured playlist with a Play button, and a grid of chart and playlist tiles below it. */
export function HomeHero({ featured, tiles }: HomeHeroProps) {
  const tileWidth = useGridCardWidth();
  const href = entityHref(featured.type, featured.url);
  const { run, pending } = usePending();
  const { type, url } = featured;

  const content = (
    <>
      <Artwork
        image={featured.image}
        quality="high"
        style={{ width: "100%", aspectRatio: 1, borderRadius: radii.lg }}
      />
      <View>
        <Text variant="caption" tone="muted">
          Featured playlist
        </Text>
        <Text variant="title" numberOfLines={1}>
          {featured.name}
        </Text>
      </View>
    </>
  );
  const label = `Featured playlist, ${featured.name}`;

  return (
    <View className="gap-3 px-page py-2">
      {href ? (
        <Link href={href} asChild>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={label}
            className="gap-2 active:opacity-70"
          >
            {content}
          </Pressable>
        </Link>
      ) : (
        <View accessible accessibilityLabel={label} className="gap-2">
          {content}
        </View>
      )}
      {isPlayable(type) ? (
        <Button
          label="Play"
          icon={{ ios: "play.fill", android: "play_arrow" }}
          accessibilityLabel={`Play ${featured.name}`}
          onPress={() => void run(() => playEntity(type, url))}
          disabled={pending}
        />
      ) : null}
      {tiles.length > 0 ? (
        <View className="flex-row flex-wrap pt-2" style={{ gap: GRID_GAP }}>
          {tiles.map((tile) => (
            <MediaCard key={tile.id} item={tile} width={tileWidth} />
          ))}
        </View>
      ) : null}
    </View>
  );
}
