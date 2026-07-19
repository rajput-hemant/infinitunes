import type { ArtistMap } from "./artist";
import type { Lang, Quality, Rights, Type } from "./misc";

export type SongObj = {
  songs: Song[];
  modules?: SongModules;
};

export type Song = {
  id: string;
  title: string;
  subtitle: string;
  header_desc: string;
  type: "song";
  perma_url: string;
  image: Quality;
  language: string;
  year: string;
  play_count: string;
  explicit_content: string;
  list: string;
  list_type: string;
  list_count: string;
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
  duration: string;
  rights: Rights;
  has_lyrics: boolean;
  lyrics_id?: string;
  lyrics_snippet: string;
  starred: boolean;
  copyright_text: string;
  more_info: SongMoreInfo;
  release_date?: string;
  vcode: string;
  vlink: string;
  triller_available: boolean;
};

export type SongMoreInfo = {
  artistMap: ArtistMap;
  song_count?: string;
  copyright_text?: string;
  is_dolby_content?: boolean;
  label_url?: string;
  album_id?: string;
  album?: string;
  album_url?: string;
  duration?: string;
  release_date?: string;
  video_available?: boolean;
  triller_available?: boolean;
  primary_artists?: string;
  singers?: string;
  language?: string;
  vcode?: string;
  vlink?: string;
  encrypted_media_url?: string;
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

export type MiniResponse = {
  id: string;
  title: string;
  subtitle?: string;
  header_desc?: string;
  type: Type;
  perma_url: string;
  image: Quality;
  color?: string;
  duration?: string;
  album?: string;
  album_id?: string;
  album_url?: string;
  download_url?: Quality;
  artist_map?: ArtistMap;
  explicit_content?: string;
  list?: string;
};
