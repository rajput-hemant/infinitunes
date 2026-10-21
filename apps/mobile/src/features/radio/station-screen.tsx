import { decode, getImageSrc, toSongRow } from "@infinitunes/types";
import type { StationDetailsResponse } from "@infinitunes/types";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { Stack } from "expo-router";
import { RefreshControl, View } from "react-native";

import { EmptyState } from "~/components/empty-state";
import { ENTITY_ART_SIZE } from "~/components/entity-header";
import { ErrorState } from "~/components/error-state";
import { ScreenScrollView } from "~/components/screen-scroll-view";
import { EntityHeaderSkeleton, SongListSkeleton } from "~/components/skeletons";
import { SongRow } from "~/components/song-row";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { trpc } from "~/lib/trpc";
import type { StationRef } from "~/navigation/station-ref";
import { startStation } from "~/playback/radio";

/** A station's artwork, name and Play, then the songs coming up. */
export function StationScreen({ name, token }: StationRef) {
  const station = useQuery(
    trpc.radio.stationDetails.queryOptions({ name, token }),
  );

  return (
    <ScreenScrollView
      refreshControl={
        <RefreshControl
          refreshing={station.isRefetching}
          onRefresh={() => void station.refetch()}
        />
      }
    >
      <Stack.Screen
        options={{
          title: station.data ? decode(station.data.station.title) : "Radio",
        }}
      />
      {station.data ? (
        <StationDetails details={station.data} />
      ) : station.error ? (
        <ErrorState
          error={station.error}
          onRetry={() => void station.refetch()}
        />
      ) : (
        <>
          <EntityHeaderSkeleton />
          <SongListSkeleton />
        </>
      )}
    </ScreenScrollView>
  );
}

function StationDetails({ details }: { details: StationDetailsResponse }) {
  const { station, songs } = details;
  const rows = songs.map(toSongRow);

  return (
    <>
      <View className="items-center gap-4 px-page pb-4 pt-2">
        <Image
          source={getImageSrc(station.image, "high")}
          style={{
            width: ENTITY_ART_SIZE,
            height: ENTITY_ART_SIZE,
            borderRadius: ENTITY_ART_SIZE / 2,
          }}
          transition={150}
          accessibilityIgnoresInvertColors
        />
        <View className="items-center gap-1">
          <Text variant="caption" tone="muted">
            Radio station
          </Text>
          <Text
            variant="title"
            accessibilityRole="header"
            className="text-center"
            numberOfLines={2}
          >
            {decode(station.title)}
          </Text>
          {station.subtitle ? (
            <Text tone="muted">{decode(station.subtitle)}</Text>
          ) : null}
        </View>
        <Button
          label="Play"
          icon={{ ios: "play.fill", android: "play_arrow" }}
          onPress={() => startStation(details)}
          className="self-stretch"
        />
      </View>

      {rows.length > 0 ? (
        <View>
          <Text
            variant="title"
            accessibilityRole="header"
            className="px-page pb-1 pt-2"
          >
            Coming up
          </Text>
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
          icon={{ ios: "dot.radiowaves.left.and.right", android: "radio" }}
          title="Ready to tune in"
          message="Tap Play to tune into this radio station."
        />
      )}
    </>
  );
}
