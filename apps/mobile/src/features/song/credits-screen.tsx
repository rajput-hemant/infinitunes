import { decode, formatReleaseDate } from "@infinitunes/types";
import type { ArtistMini, Song, SongObj } from "@infinitunes/types";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Platform, View } from "react-native";

import { DetailScreen } from "~/components/detail/detail-screen";
import { ListRow } from "~/components/list-row";
import { SkeletonText } from "~/components/skeletons";
import { artworkFrame } from "~/components/ui/artwork";
import { range, SkeletonBlock, SkeletonPulse } from "~/components/ui/skeleton";
import { Text } from "~/components/ui/text";
import { entityQueries } from "~/lib/entity-queries";
import { joinMeta } from "~/lib/meta";
import { entityHref } from "~/navigation/entity-href";
import { sizes, space } from "~/theme/tokens";
import { useRadii } from "~/theme/use-radii";

const CREDIT_SECTIONS = [
  "Performing Artists",
  "Composition & Lyrics",
  "Starring",
  "Other",
] as const;
type CreditSection = (typeof CREDIT_SECTIONS)[number];

/** Upstream's `artistMap` roles; any role we do not know lands in "Other". */
const ROLE_SECTIONS: Record<string, CreditSection> = {
  singer: "Performing Artists",
  primary_artists: "Performing Artists",
  featured_artists: "Performing Artists",
  music: "Composition & Lyrics",
  music_director: "Composition & Lyrics",
  composer: "Composition & Lyrics",
  lyricist: "Composition & Lyrics",
  starring: "Starring",
};

/** "music_director" as "Music director"; plain "music" reads "Composer". */
function roleLabel(role: string): string {
  if (role === "music") return "Composer";
  const words = role.replaceAll("_", " ");
  return `${words.charAt(0).toUpperCase()}${words.slice(1)}`;
}

type Person = { artist: ArtistMini; roles: string[] };

/** Each credited artist once per section, with that section's roles joined. */
export function creditGroups(song: Song) {
  const groups = new Map<CreditSection, Map<string, Person>>();
  for (const artist of song.more_info.artistMap?.artists ?? []) {
    if (!artist.name) continue;
    const section = ROLE_SECTIONS[artist.role] ?? "Other";
    const people = groups.get(section) ?? new Map<string, Person>();
    const person = people.get(artist.id) ?? { artist, roles: [] };
    const role = roleLabel(artist.role || "credit");
    if (!person.roles.includes(role)) person.roles.push(role);
    people.set(artist.id, person);
    groups.set(section, people);
  }
  return CREDIT_SECTIONS.flatMap((title) => {
    const people = groups.get(title);
    return people ? [{ title, people: [...people.values()] }] : [];
  });
}

function selectSong(data: SongObj): Song | null {
  const [song] = data.songs;
  return song?.type === "song" ? song : null;
}

/** iOS: an inset card of rows; Android 16: each row its own tile on 2dp seams. */
function Group({ title, children }: { title: string; children: ReactNode }) {
  const android = Platform.OS === "android";
  return (
    <View className="gap-2 pt-4">
      <Text
        accessibilityRole="header"
        variant={android ? "label" : "footnote"}
        tone={android ? "primary" : "muted"}
        className={android ? "px-6" : "px-6 uppercase"}
      >
        {title}
      </Text>
      <View
        className="mx-page overflow-hidden rounded-lg"
        style={{ gap: android ? sizes.seam : 0 }}
      >
        {children}
      </View>
    </View>
  );
}

function CreditsPage({ song }: { song: Song }) {
  const { more_info: info } = song;
  const released = formatReleaseDate(info.release_date);
  const artistLine = decode(song.subtitle.split(" - ")[0] ?? "");
  const albumHref = entityHref("album", info.album_url);

  return (
    <View className="w-full max-w-readable self-center pb-4">
      <View className="px-page pb-2 pt-2">
        <Text variant="title1" emphasized accessibilityRole="header">
          Credits
        </Text>
        <Text tone="muted" numberOfLines={1}>
          {joinMeta([decode(song.title), artistLine])}
        </Text>
      </View>
      {info.album ? (
        <Group title="Album">
          <View className="bg-card">
            <ListRow
              title={decode(info.album)}
              subtitle={joinMeta([decode(info.label), released])}
              leading={{ artwork: song.image }}
              href={albumHref}
              chevron={Boolean(albumHref)}
            />
          </View>
        </Group>
      ) : null}
      {creditGroups(song).map(({ title, people }) => (
        <Group key={title} title={title}>
          {people.map(({ artist, roles }) => {
            const href = entityHref("artist", artist.perma_url);
            return (
              <View key={artist.id} className="bg-card">
                <ListRow
                  title={decode(artist.name)}
                  subtitle={roles.join(", ")}
                  leading={{ artwork: artist.image, round: true }}
                  href={href}
                  chevron={Boolean(href)}
                />
              </View>
            );
          })}
        </Group>
      ))}
      {info.copyright_text ? (
        <View className="px-6 pt-4">
          <Text variant="caption" tone="muted">
            {decode(info.copyright_text)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function CreditRowSkeleton({ round = false }: { round?: boolean }) {
  const radii = useRadii();
  return (
    <View
      className="min-h-row flex-row items-center gap-3 bg-card py-1"
      style={{
        paddingStart: space.lg - (Platform.OS === "android" ? space.sm : 0),
        paddingEnd: space.lg,
      }}
    >
      <SkeletonBlock style={artworkFrame("row", 0, round, radii)} />
      <View className="flex-1">
        <SkeletonText variant="body" width="60%" />
        <SkeletonText variant="footnote" width="40%" />
      </View>
    </View>
  );
}

/** The same inset cards, row artwork and readable width as the loaded page. */
function CreditsSkeleton() {
  return (
    <SkeletonPulse>
      <View className="w-full max-w-readable self-center pb-4">
        <View className="px-page pb-2 pt-2">
          <SkeletonText variant="title1" width={120} />
          <SkeletonText variant="body" width={200} />
        </View>
        <Group title="Album">
          <CreditRowSkeleton />
        </Group>
        <Group title="Performing Artists">
          {range(3).map((row) => (
            <CreditRowSkeleton key={row} round />
          ))}
        </Group>
      </View>
    </SkeletonPulse>
  );
}

/**
 * A song's credits as Apple Music shows them: grouped by what each artist did
 * (performing, composition and lyrics, starring), one row per person with
 * their roles. Reads the song's own details query, already cached by the song
 * screen it opens from.
 */
export function CreditsScreen({ token }: { token: string }) {
  const query = useQuery({ ...entityQueries.song(token), select: selectSong });

  return (
    <DetailScreen
      query={query}
      skeleton={<CreditsSkeleton />}
      noun="Song"
      icon={{ ios: "music.note", android: "music_note" }}
      identity={(song) => ({
        name: decode(song.title),
        type: song.type,
        url: song.perma_url,
      })}
    >
      {(song) => <CreditsPage song={song} />}
    </DetailScreen>
  );
}
