import type { Episode, EpisodeDetail } from "@infinitunes/types";
import {
  decode,
  formatDuration,
  isExplicit,
  plainText,
  toSongRow,
} from "@infinitunes/types";
import { RefreshControl } from "react-native";

import { CollectionMenu } from "~/components/collection-menu";
import { EntityHeader } from "~/components/entity-header";
import { ListRow } from "~/components/list-row";
import { ScreenScrollView } from "~/components/screen-scroll-view";
import { SectionHeader } from "~/components/section-header";
import { Text } from "~/components/ui/text";
import { joinMeta, playsLabel } from "~/lib/meta";
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
  return joinMeta([
    playsLabel(episode.play_count),
    formatDuration(episode.more_info.duration, "mm:ss"),
    decode(episode.language),
  ]);
}

/** The way back to the episode's show, when upstream gives its URL. */
function ShowLink({ episode }: { episode: Episode }) {
  const href = entityHref("show", episode.more_info.show_url);
  if (!href) return null;

  return (
    <>
      <SectionHeader title="More From This Podcast" />
      <ListRow
        leading={{ icon: { ios: "mic", android: "podcasts" } }}
        title={decode(episode.more_info.show_title)}
        href={href}
        trailing={{ chevron: true }}
      />
    </>
  );
}

/** Upstream names the section in lower case ("episode details"). */
function capitalized(text: string): string {
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
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
        eyebrow="Episode"
        title={row.name}
        subtitle={row.subtitle}
        meta={meta}
        explicit={isExplicit(episode.explicit_content)}
        onPlay={play}
        actions={<CollectionMenu name={row.name} rows={[row]} />}
      />
      {description ? (
        <>
          <SectionHeader
            title={capitalized(decode(modules.episode_details.title))}
          />
          <Text tone="muted" selectable className="px-page">
            {description}
          </Text>
        </>
      ) : null}
      <ShowLink episode={episode} />
    </ScreenScrollView>
  );
}
