import { decode } from "@infinitunes/types";
import type { Mix } from "@infinitunes/types";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { EntityHeader } from "~/components/entity-header";
import { DetailScreen } from "~/features/song/detail-screen";
import { DetailSkeleton } from "~/features/song/detail-skeleton";
import { joinMeta, songCountLabel } from "~/features/song/meta";
import { playAll, shuffleAll } from "~/features/song/play-collection";
import { songRowsOf } from "~/features/song/song-rows";
import { TrackList } from "~/features/song/track-list";
import { trpc } from "~/lib/trpc";

/** The web page's mix request: the first twenty songs in these languages. */
const MIX_REQUEST = { page: 1, n: 20, lang: "hindi,english" } as const;

type MixScreenProps = {
  token: string;
};

export function MixScreen({ token }: MixScreenProps) {
  const query = useQuery(trpc.get.mix.queryOptions({ token, ...MIX_REQUEST }));

  return (
    <DetailScreen
      query={query}
      skeleton={<DetailSkeleton />}
      noun="mix"
      identity={(mix) => ({ name: decode(mix.title), url: mix.perma_url })}
    >
      {(mix) => <MixPage mix={mix} />}
    </DetailScreen>
  );
}

function MixPage({ mix }: { mix: Mix }) {
  const rows = useMemo(() => songRowsOf(mix.list), [mix]);
  const { firstname, lastname } = mix.more_info;

  return (
    <>
      {/* A mix is not a favorite type, so its header has no heart. */}
      <EntityHeader
        image={mix.image}
        title={decode(mix.title)}
        subtitle={joinMeta([
          decode(firstname),
          decode(lastname),
          songCountLabel(rows.length),
        ])}
        onPlay={() => playAll(rows)}
        onShuffle={() => shuffleAll(rows)}
      />
      <TrackList rows={rows} />
    </>
  );
}
