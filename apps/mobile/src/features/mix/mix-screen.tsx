import { decode } from "@infinitunes/types";
import type { Mix } from "@infinitunes/types";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { CollectionMenu } from "~/components/collection-menu";
import { DetailScreen } from "~/components/detail/detail-screen";
import { DetailSkeleton } from "~/components/detail/detail-skeleton";
import { EntityHeader } from "~/components/entity-header";
import { TrackList } from "~/components/track-list";
import { joinMeta, songCountLabel, totalDurationLabel } from "~/lib/meta";
import { songRowsOf } from "~/lib/song-rows";
import { trpc } from "~/lib/trpc";
import { playAll, shuffleAll } from "~/playback/play-collection";

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
      skeleton={<DetailSkeleton like={false} shelf={false} />}
      noun="Mix"
      icon={{ ios: "music.note.list", android: "queue_music" }}
      identity={(mix) => ({
        name: decode(mix.title),
        type: "mix",
        url: mix.perma_url,
      })}
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
        eyebrow="Mix"
        title={decode(mix.title)}
        subtitle={[decode(firstname), decode(lastname)]
          .filter(Boolean)
          .join(" ")}
        meta={joinMeta([songCountLabel(rows.length), totalDurationLabel(rows)])}
        onPlay={() => playAll(rows)}
        onShuffle={() => shuffleAll(rows)}
        actions={<CollectionMenu name={decode(mix.title)} rows={rows} />}
      />
      <TrackList rows={rows} />
    </>
  );
}
