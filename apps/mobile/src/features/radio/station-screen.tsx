import { decode, toSongRow } from "@infinitunes/types";
import type { StationDetailsResponse } from "@infinitunes/types";
import { useQuery } from "@tanstack/react-query";
import { View } from "react-native";

import { DetailScreen } from "~/components/detail/detail-screen";
import { EmptyState } from "~/components/empty-state";
import { EntityHeader } from "~/components/entity-header";
import { SectionHeading } from "~/components/section-heading";
import { EntityHeaderSkeleton, SongListSkeleton } from "~/components/skeletons";
import { SongRow } from "~/components/song-row";
import { trpc } from "~/lib/trpc";
import type { StationRef } from "~/navigation/entity-href";
import { startStation } from "~/playback/radio";

const STATION_ICON = {
  ios: "dot.radiowaves.left.and.right",
  android: "radio",
} as const;

/** A station's artwork, name and Play, then the songs coming up. */
export function StationScreen({ name, token }: StationRef) {
  const query = useQuery(
    trpc.radio.stationDetails.queryOptions({ name, token }),
  );

  return (
    <DetailScreen
      query={query}
      skeleton={
        <>
          <EntityHeaderSkeleton round shuffle={false} />
          <SongListSkeleton />
        </>
      }
      noun="Station"
      icon={STATION_ICON}
      identity={({ station }) => ({
        name: decode(station.title),
        type: "radio_station",
        url: station.perma_url,
      })}
    >
      {(details) => <StationDetails details={details} />}
    </DetailScreen>
  );
}

function StationDetails({ details }: { details: StationDetailsResponse }) {
  const { station, songs } = details;
  const rows = songs.map(toSongRow);

  return (
    <>
      <EntityHeader
        image={station.image}
        title={decode(station.title)}
        subtitle={station.subtitle ? decode(station.subtitle) : undefined}
        eyebrow="Radio station"
        round
        onPlay={() => startStation(details)}
      />
      {rows.length > 0 ? (
        <View>
          <SectionHeading>Coming up</SectionHeading>
          {rows.map((row, index) => (
            <SongRow
              key={row.id}
              song={row}
              onPress={() => startStation(details, index)}
            />
          ))}
        </View>
      ) : (
        <EmptyState
          icon={STATION_ICON}
          title="Ready to tune in"
          message="Tap Play to tune into this radio station."
        />
      )}
    </>
  );
}
