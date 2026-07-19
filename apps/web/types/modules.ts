import type { Album } from "./album";
import type { Chart, Radio, Trending } from "./get";
import type { Quality, Type } from "./misc";
import type { Playlist } from "./playlist";
import type { Song } from "./song";

export type Module<T> = {
  title: string;
  subtitle: string;
  position: number;
  featured_text?: string;
  source: string;
  data: T[];
};

export type Modules = {
  new_albums: (Album | Song)[];
  artist_recos?: ArtistReco[];
  browse_discover: Discover[];
  charts: Chart[];
  city_mod?: CityMod[];
  global_config: GlobalConfig;
  modules: ModuleMap;
  new_trending: Trending;
  radio: Radio[];
  tag_mixes?: TagMix[];
  top_playlists: Playlist[];
} & Record<string, Promo[]>;

export type ModuleMap = {
  artist_recos?: ModuleItem;
  charts: ModuleItem;
  city_mod?: ModuleItem;
  new_albums: ModuleItem;
  new_trending: ModuleItem;
  radio: ModuleItem;
  tag_mixes?: ModuleItem;
  top_playlists: ModuleItem;
} & Record<string, ModuleItem>;

export type ModuleItem = {
  title: string;
  subtitle: string;
  position: number;
  featured_text?: string;
};

export type ArtistReco = {
  explicit_content: string;
  id: string;
  image: Quality;
  perma_url: string;
  subtitle: string;
  title: string;
  type: Type;
  more_info: {
    featured_station_type: Type;
    query: string;
    station_display_text: string;
  };
};

export type Discover = {
  explicit_content: string;
  id: string;
  image: Quality;
  perma_url: string;
  subtitle: string;
  title: string;
  type: "channel";
  more_info: {
    available: string;
    badge: string;
    tags: Record<string, string[]>;
    is_featured: string;
    sub_type: Type;
    video_thumbnail: string;
    video_url: string;
  };
};

export type CityMod = {
  explicit_content: string;
  id: string;
  image: Quality;
  perma_url: string;
  subtitle: string;
  title: string;
  type: Type;
  more_info: {
    album_id?: string;
    featured_station_type?: string;
    query?: string;
    multiple_tunes?: {
      id: string;
      subtype: Type;
      title: string;
      type: Type;
    }[];
  };
};

export type TagMix = {
  explicit_content: string;
  id: string;
  image: Quality;
  perma_url: string;
  subtitle: string;
  title: string;
  type: Type;
  language: string;
  list_count: string;
  list_type: Type;
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
  image: Quality;
  perma_url: string;
  subtitle: string;
  title: string;
  type: Type;
  language?: string;
  list_count?: string;
  list_type?: string;
  list?: string;
  play_count?: string;
  year?: string;
  more_info: Partial<{
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
