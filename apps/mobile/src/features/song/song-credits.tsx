import { decode, formatDuration, formatReleaseDate } from "@infinitunes/types";
import type { Song } from "@infinitunes/types";
import { Link } from "expo-router";
import type { Href } from "expo-router";
import { Pressable, View } from "react-native";

import { SectionHeading } from "~/components/section-heading";
import { Text } from "~/components/ui/text";
import { joinMeta, playsLabel } from "~/lib/meta";
import { entityHref } from "~/navigation/entity-href";

type CreditRowProps = {
  label: string;
  value: string;
  /** Makes the row a link to the credited item's screen. */
  href?: Href;
};

function CreditRow({ label, value, href }: CreditRowProps) {
  if (!value) return null;

  const row = (
    <Pressable
      disabled={!href}
      accessibilityRole={href ? "link" : undefined}
      accessibilityLabel={`${label}, ${value}`}
      className="min-h-ctl flex-row items-center justify-between gap-4 px-page active:opacity-70"
    >
      <Text tone="muted" className="capitalize">
        {label}
      </Text>
      <Text numberOfLines={1} className="flex-1 text-right">
        {value}
      </Text>
    </Pressable>
  );
  return href ? (
    <Link href={href} asChild>
      {row}
    </Link>
  ) : (
    row
  );
}

function roleLabel(role: string): string {
  return role.replaceAll("_", " ");
}

/** Who made the song and where it lives: album, credited artists by role, label, facts. */
export function SongCredits({ song }: { song: Song }) {
  const { more_info: info } = song;
  const credits = info.artistMap?.artists ?? [];

  return (
    <View className="pb-3">
      <SectionHeading>Credits</SectionHeading>
      <CreditRow
        label="Album"
        value={decode(info.album)}
        href={entityHref("album", info.album_url)}
      />
      {credits.map((artist) => (
        <CreditRow
          key={`${artist.id}-${artist.role}`}
          label={roleLabel(artist.role)}
          value={decode(artist.name)}
          href={entityHref("artist", artist.perma_url)}
        />
      ))}
      <CreditRow
        label="Label"
        value={decode(info.label)}
        href={entityHref("label", info.label_url)}
      />
      <CreditRow
        label="Released"
        value={formatReleaseDate(info.release_date)}
      />
      <CreditRow
        label="Duration"
        value={formatDuration(info.duration, "mm:ss")}
      />
      <View className="gap-1 px-page pt-2">
        <Text variant="caption" tone="muted">
          {joinMeta([playsLabel(song.play_count), decode(song.language)])}
        </Text>
        <Text variant="caption" tone="muted">
          {decode(info.copyright_text)}
        </Text>
      </View>
    </View>
  );
}
