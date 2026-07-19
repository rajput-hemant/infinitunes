import type { ArtistMap } from "./artist";
import type { Lang, Quality, Rights } from "./misc";

export type SongObj = {
  songs: Song[];
  modules?: SongModules;
};

export type Song = {
  id: string;
  name: string;
  subtitle: string;
  header_desc: string;
  type: "song";
  url: string;
  image: Quality;
  language: string;
  year: number;
  play_count: number;
  explicit: boolean;
  list: string;
  list_type: string;
  list_count: number;
  music: string;
  song?: string;
  album: string;
  album_id: string;
  album_url: string;
  label: string;
  label_url: string;
  origin: string;
  is_dolby_content: boolean;
  "320kbps": boolean;
  download_url: Quality;
  duration: number;
  rights: Rights;
  has_lyrics: boolean;
  lyrics_id?: string;
  lyrics_snippet: string;
  starred: boolean;
  copyright_text: string;
  artist_map: ArtistMap;
  release_date?: string;
  vcode: string;
  vlink: string;
  triller_available: boolean;
};

export type SongModules = {
  recommend: {
    title: string;
    subtitle: string;
    source: string;
    position: number;
    params: {
      id: string;
      lang: Lang;
    };
  };
  currently_trending: {
    title: string;
    subtitle: string;
    source: string;
    position: number;
    params: {
      type: string;
      lang: Lang;
    };
  };
  songs_by_same_artists: {
    title: string;
    subtitle: string;
    source: string;
    position: number;
    params: {
      artist_id: string;
      song_id: string;
      lang: Lang;
    };
  };
  songs_by_same_actors: {
    title: string;
    subtitle: string;
    source: string;
    position: number;
    params: {
      actor_id: string;
      song_id: string;
      lang: Lang;
    };
  };
  artists: {
    title: string;
    subtitle: string;
    source: string;
    position: number;
  };
};
