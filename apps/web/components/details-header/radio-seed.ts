import type { MediaType, SongRowItem } from "@infinitunes/types";

import type { RadioSeed } from "~/components/song-list/more-button-radio";

type HeaderRadioInput = {
  type: MediaType;
  name: string;
  artistId?: string;
  songs: SongRowItem[];
  language?: string;
};

/**
 * The station an album, playlist or artist header starts: an artist's own
 * station, the first song's lead artist for a collection, or a featured one.
 */
export function headerRadioSeed(input: HeaderRadioInput): RadioSeed {
  const { type, name, artistId, songs, language } = input;
  const stationLanguage = language || songs[0]?.language;

  if (type === "artist") {
    return { type: "artist", name, artistId, language: stationLanguage };
  }

  const primary = songs[0]?.primaryArtists[0];
  if (primary) {
    return {
      type: "artist",
      name: primary.name,
      artistId: primary.id,
      language: stationLanguage,
    };
  }

  return { type: "featured", name, artistId, language: stationLanguage };
}
