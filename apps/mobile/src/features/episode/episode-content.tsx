import type { Episode, EpisodeDetail } from "@infinitunes/types";
import {
  decode,
  formatCount,
  formatDuration,
  isExplicit,
  plainText,
  toSongRow,
} from "@infinitunes/types";
import { Link } from "expo-router";
import { Pressable, RefreshControl, View } from "react-native";

import { CollectionMenu } from "~/components/collection-menu";
import { EntityHeader } from "~/components/entity-header";
import { ScreenScrollView } from "~/components/screen-scroll-view";
import { Icon } from "~/components/ui/icon";
import { Text } from "~/components/ui/text";
import { entityHref } from "~/navigation/entity-href";
import { playAll } from "~/playback/play-collection";

type EpisodeContentProps = {
  episode: Episode;
  modules: EpisodeDetail["modules"];
  onRefresh: () => Promise<unknown>;
  isRefreshing: boolean;
};

/** "12.5K Plays · 62:05 · hindi", skipping what upstream leaves out. */
function metaLine(episode: Episode): string {
  const plays = Number(episode.play_count) > 0;
  return [
    plays ? `${formatCount(episode.play_count)} Plays` : "",
    formatDuration(episode.more_info.duration, "mm:ss"),
    decode(episode.language),
  ]
    .filter(Boolean)
    .join(" · ");
}

/** The way back to the episode's show, when upstream gives its URL. */
function ShowLink({ episode }: { episode: Episode }) {
  const href = entityHref("show", episode.more_info.show_url);
  if (!href) return null;

  return (
    <Link href={href} asChild>
      <Pressable
        accessibilityRole="link"
        className="min-h-row flex-row items-center justify-between px-page py-1 active:opacity-70"
      >
        <View className="flex-1">
          <Text variant="subhead" tone="muted">
            More from
          </Text>
          <Text numberOfLines={1}>{decode(episode.more_info.show_title)}</Text>
        </View>
        <Icon
          name={{ ios: "chevron.forward", android: "chevron_right" }}
          size={16}
        />
      </Pressable>
    </Link>
  );
}

/** A loaded episode: header with play, what it is about and a link to its show. */
export function EpisodeContent({
  episode,
  modules,
  onRefresh,
  isRefreshing,
}: EpisodeContentProps) {
  const row = toSongRow(episode);
  const description = plainText(episode.more_info.description);
  const meta = metaLine(episode);

  // One episode: shuffling it is playing it, the header just has both buttons.
  const play = () => playAll([row]);

  return (
    <ScreenScrollView
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => void onRefresh()}
        />
      }
    >
      <EntityHeader
        image={episode.image}
        title={row.name}
        subtitle={[row.subtitle, meta].filter(Boolean).join("\n")}
        explicit={isExplicit(episode.explicit_content)}
        onPlay={play}
        actions={<CollectionMenu name={row.name} rows={[row]} />}
      />
      {description ? (
        <View className="gap-1 px-page pb-3">
          <Text
            variant="headline"
            accessibilityRole="header"
            className="capitalize"
          >
            {decode(modules.episode_details.title)}
          </Text>
          <Text tone="muted" selectable>
            {description}
          </Text>
        </View>
      ) : null}
      <ShowLink episode={episode} />
    </ScreenScrollView>
  );
}
