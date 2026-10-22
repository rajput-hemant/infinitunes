import { decode, formatDuration, formatReleaseDate } from "@infinitunes/types";
import type { Song } from "@infinitunes/types";
import type { Href } from "expo-router";
import { View } from "react-native";

import { ListRow } from "~/components/list-row";
import { SectionHeader } from "~/components/section-header";
import { Text } from "~/components/ui/text";
import { joinMeta, playsLabel } from "~/lib/meta";
import { entityHref } from "~/navigation/entity-href";

type Credit = {
  key: string;
  /** Who or what is credited ("Flipperachi"). */
  name: string;
  /** As what ("Singer", "Album"). */
  role: string;
  href: Href | undefined;
};

/** "music_director" as "Music director". */
function roleLabel(role: string): string {
  const words = role.replaceAll("_", " ");
  return `${words.charAt(0).toUpperCase()}${words.slice(1)}`;
}

function creditsOf(song: Song): Credit[] {
  const { more_info: info } = song;
  const credits: Credit[] = [
    {
      key: "album",
      name: decode(info.album),
      role: "Album",
      href: entityHref("album", info.album_url),
    },
    ...(info.artistMap?.artists ?? []).map((artist) => ({
      key: `${artist.id}-${artist.role}`,
      name: decode(artist.name),
      role: roleLabel(artist.role),
      href: entityHref("artist", artist.perma_url),
    })),
    {
      key: "label",
      name: decode(info.label),
      role: "Label",
      href: entityHref("label", info.label_url),
    },
  ];
  return credits.filter((credit) => credit.name);
}

/**
 * Who made the song and where it lives (album, credited artists by role,
 * label) as rows into their screens, then the facts that have none.
 */
export function SongCredits({ song }: { song: Song }) {
  const { more_info: info } = song;
  const released = formatReleaseDate(info.release_date);

  return (
    <View>
      <SectionHeader title="Credits" />
      {creditsOf(song).map(({ key, name, role, href }) => (
        <ListRow
          key={key}
          title={name}
          subtitle={role}
          href={href}
          trailing={href ? { chevron: true } : undefined}
        />
      ))}
      <View className="px-page pt-2">
        <Text variant="caption" tone="muted">
          {joinMeta([
            released && `Released ${released}`,
            formatDuration(info.duration, "mm:ss"),
            playsLabel(song.play_count),
            decode(song.language),
          ])}
        </Text>
        <Text variant="caption" tone="muted">
          {decode(info.copyright_text)}
        </Text>
      </View>
    </View>
  );
}
