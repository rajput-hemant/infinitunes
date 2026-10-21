import { decode } from "@infinitunes/types";
import { Stack } from "expo-router";

import { DetailFailure } from "~/features/artist/detail-failure";
import { detailHeaderOptions } from "~/features/artist/detail-header-options";

import { EpisodeContent } from "./episode-content";
import { EpisodeSkeleton } from "./episode-skeleton";
import { useEpisode } from "./use-episode";

/** Upstream answered, but with no episode in it: the same as an unknown token. */
const NO_EPISODE = { code: "NOT_FOUND" };

/** The episode behind a route token: loading, not found, failed, or the episode. */
export function EpisodeScreen({ token }: { token: string }) {
  const { data, error, isPending, isRefetching, refetch } = useEpisode(token);
  const episode = data?.episodes[0];

  if (data && episode) {
    return (
      <>
        <Stack.Screen
          options={detailHeaderOptions({
            name: decode(episode.title),
            url: episode.perma_url,
          })}
        />
        <EpisodeContent
          episode={episode}
          modules={data.modules}
          onRefresh={refetch}
          isRefreshing={isRefetching}
        />
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={detailHeaderOptions()} />
      {isPending ? (
        <EpisodeSkeleton />
      ) : (
        <DetailFailure
          noun="Episode"
          icon={{ ios: "mic", android: "podcasts" }}
          error={error ?? NO_EPISODE}
          onRetry={() => void refetch()}
        />
      )}
    </>
  );
}
