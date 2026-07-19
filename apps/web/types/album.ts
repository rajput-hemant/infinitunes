import type { ArtistMap } from "./artist";
import type { Quality } from "./misc";
import type { Song } from "./song";

export type Album = {
  explicit: boolean;
  id: string;
  image: Quality;
  url: string;
  subtitle: string;
  name: string;
  type: "album";
  header_desc: string;
  language: string;
  play_count: number;
  duration: number;
  year: number;
  list_count: number;
  list_type: string;
  artist_map: ArtistMap;
  song_count: number;
  label_url: string;
  copyright_text: string;
  is_dolby_content: boolean;
  songs: Song[];
  modules: {
    recommend: {
      source: string;
      position: number;
      title: string;
      subtitle: string;
      params: { id: string };
    };
    currently_trending: {
      source: string;
      position: number;
      title: string;
      subtitle: string;
      params: { type: string; lang: string };
    };
    top_albums_from_same_year: {
      source: string;
      position: number;
      title: string;
      subtitle: string;
      params: { year: string; lang: string };
    };
    artists: {
      source: string;
      position: number;
      title: string;
      subtitle: string;
    };
  };
};
