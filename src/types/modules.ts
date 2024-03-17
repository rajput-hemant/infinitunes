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
  albums: Module<Album | Song>;
  artist_recos: Module<ArtistReco>;
  charts: Module<Chart>;
  city_mod?: Module<CityMod>;
  discover: Module<Discover>;
  mixes: Module<TagMix>;
  playlists: Module<Playlist>;
  radio: Module<Radio>;
  trending: Module<Trending[0]>;
  global_config: GlobalConfig;
};
// & Record<string, Module<Promo>>;

export type ArtistReco = {
  explicit: boolean;
  id: string;
  image: Quality;
  url: string;
  subtitle: string;
  name: string;
  type: Type;
  featured_station_type: Type;
  query: string;
  station_display_text: string;
};

export type Discover = {
  explicit: boolean;
  id: string;
  image: Quality;
  url: string;
  subtitle: string;
  name: string;
  type: "channel";
  badge: string;
  is_featured: boolean;
  sub_type: Type;
  tags: Record<string, string[]>;
  video_thumbnail: string;
  video_url: string;
};

export type CityMod = {
  explicit: boolean;
  id: string;
  image: Quality;
  url: string;
  subtitle: string;
  name: string;
  type: Type;
  album_id?: string;
  featured_station_type?: string;
  query?: string;
};

export type TagMix = {
  explicit: boolean;
  id: string;
  image: Quality;
  url: string;
  subtitle: string;
  name: string;
  type: Type;
  first_name: string;
  language: string;
  last_name: string;
  list_count: number;
  list_type: Type;
  list: string;
  play_count: number;
  year: number;
};

export type Promo = {
  explicit: boolean;
  id: string;
  image: Quality;
  url: string;
  subtitle: string;
  name: string;
  type: Type;
  editorial_language?: string;
  language?: string;
  list_count?: number;
  list_type?: string;
  list?: string;
  play_count?: number;
  release_year?: number;
  year?: number;
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
