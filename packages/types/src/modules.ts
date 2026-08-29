import type { Album } from "./album";
import type { Chart, Radio, Trending } from "./get";
import type { MediaType } from "./misc";
import type { Playlist } from "./playlist";
import type { Song } from "./song";

/** Per-section metadata living under the `modules` key, keyed by section name (e.g. `new_trending`, `charts`). */
export type ModuleMeta = {
  source: string;
  position: number;
  title: string;
  subtitle: string;
  featured_text?: string;
  [key: string]: unknown;
};

export type ArtistReco = {
  explicit_content: string;
  id: string;
  image: string;
  perma_url: string;
  subtitle: string;
  title: string;
  type: MediaType;
  more_info: {
    featured_station_type: MediaType;
    query: string;
    station_display_text: string;
  };
};

export type Discover = {
  explicit_content: string;
  id: string;
  image: string;
  perma_url: string;
  subtitle: string;
  title: string;
  type: "channel";
  more_info: {
    available: string;
    badge: string;
    tags: Record<string, string[]>;
    is_featured: string;
    sub_type: MediaType;
    video_thumbnail: string;
    video_url: string;
  };
};

export type CityMod = {
  explicit_content: string;
  id: string;
  image: string;
  perma_url: string;
  subtitle: string;
  title: string;
  type: MediaType;
  more_info: Partial<{
    album_id: string;
    featured_station_type: string;
    query: string;
    editorial_language: string;
    multiple_tunes: {
      id: string;
      subtype: MediaType;
      title: string;
      type: MediaType;
    }[];
  }>;
};

export type TagMix = {
  explicit_content: string;
  id: string;
  image: string;
  perma_url: string;
  subtitle: string;
  title: string;
  type: MediaType;
  language: string;
  list_count: string;
  list_type: MediaType;
  list: string;
  more_info: {
    firstname: string;
    lastname: string;
  };
  play_count: string;
  year: string;
};

export type Promo = {
  explicit_content: string;
  id: string;
  image: string;
  perma_url: string;
  subtitle: string;
  title: string;
  type: MediaType;
  language?: string;
  list_count?: string;
  list_type?: string;
  list?: string;
  play_count?: string;
  year?: string;
  more_info?: Partial<{
    editorial_language: string;
    position: string;
    release_year: number;
    square_image: string;
  }>;
};

export type GlobalConfig = {
  random_songs_listid: GlobalConfigItem;
  weekly_top_songs_listid: GlobalConfigItem;
};

type GlobalConfigItem = Record<string, GlobalConfigItemLang>;

type GlobalConfigItemLang = {
  count: number;
  image: string;
  listid: string;
  title?: string;
};

/**
 * `webapi.getLaunchData` raw shape: section keys hold data arrays directly,
 * with a separate `modules` key carrying per-section title/position metadata
 * (not merged in by the server), plus dynamic `promo:*` and `history` keys.
 */
export type Modules = {
  new_albums: (Album | Song)[];
  artist_recos?: ArtistReco[];
  browse_discover: Discover[];
  charts: Chart[];
  city_mod?: CityMod[];
  global_config: GlobalConfig;
  modules: Record<string, ModuleMeta>;
  new_trending: Trending;
  radio: Radio[];
  tag_mixes?: TagMix[];
  top_playlists: Playlist[];
  history?: unknown[];
} & Record<string, unknown>;
