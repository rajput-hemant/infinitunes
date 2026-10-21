import { decode } from "@infinitunes/types";

import { DetailFrame } from "~/components/detail/detail-frame";

import { ShowContent } from "./show-content";
import { ShowSkeleton } from "./show-skeleton";
import { useShow } from "./use-show";

/** The show behind a route token: loading, not found, failed, or the show. */
export function ShowScreen({ token }: { token: string }) {
  const query = useShow(token);

  return (
    <DetailFrame
      query={query}
      skeleton={<ShowSkeleton />}
      noun="Podcast"
      icon={{ ios: "mic", android: "podcasts" }}
      identity={({ show_details }) => ({
        name: decode(show_details.title),
        url: show_details.perma_url,
      })}
    >
      {(show) => (
        <ShowContent
          show={show}
          onRefresh={query.refetch}
          isRefreshing={query.isRefetching}
        />
      )}
    </DetailFrame>
  );
}
