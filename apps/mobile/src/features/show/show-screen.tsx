import { decode } from "@infinitunes/types";
import { Stack } from "expo-router";

import { DetailFailure } from "~/features/artist/detail-failure";
import { detailHeaderOptions } from "~/features/artist/detail-header-options";

import { ShowContent } from "./show-content";
import { ShowSkeleton } from "./show-skeleton";
import { useShow } from "./use-show";

/** The show behind a route token: loading, not found, failed, or the show. */
export function ShowScreen({ token }: { token: string }) {
  const {
    data: show,
    error,
    isPending,
    isRefetching,
    refetch,
  } = useShow(token);

  if (show) {
    return (
      <>
        <Stack.Screen
          options={detailHeaderOptions({
            name: decode(show.show_details.title),
            url: show.show_details.perma_url,
          })}
        />
        <ShowContent
          show={show}
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
        <ShowSkeleton />
      ) : (
        <DetailFailure
          noun="Podcast"
          icon={{ ios: "mic", android: "podcasts" }}
          error={error}
          onRetry={() => void refetch()}
        />
      )}
    </>
  );
}
