import { decode } from "@infinitunes/types";

import { DetailFrame } from "~/components/detail/detail-frame";

import { EpisodeContent } from "./episode-content";
import { EpisodeSkeleton } from "./episode-skeleton";
import { useEpisode } from "./use-episode";

/** The episode behind a route token: loading, not found, failed, or the episode. */
export function EpisodeScreen({ token }: { token: string }) {
  const query = useEpisode(token);

  return (
    <DetailFrame
      query={query}
      skeleton={<EpisodeSkeleton />}
      noun="Episode"
      icon={{ ios: "mic", android: "podcasts" }}
      identity={({ episode }) => ({
        name: decode(episode.title),
        type: "episode",
        url: episode.perma_url,
      })}
    >
      {({ episode, modules }) => (
        <EpisodeContent
          episode={episode}
          modules={modules}
          onRefresh={query.refetch}
        />
      )}
    </DetailFrame>
  );
}
