import { Album } from "./album";
import { Quality, Type } from "./misc";
import { Playlist } from "./playlist";
import { Song } from "./song";

type A<T> = {
  count: number;
  last_page: boolean;
  data: T[];
};

type B = {
  id: string;
  title: string;
  action: string;
};

export type FooterDetails = {
  playlist: B[];
  artist: B[];
  album: B[];
  actor: B[];
};

export type Lyrics = {
  lyrics: string;
  script_tracking_url: string;
  lyrics_copyright: string;
  snippet: string;
};

export type Trending = (Album | Song | Playlist)[];

export type FeaturedPlaylists = A<Playlist>;

export type Chart = {
  id: string;
  name: string;
  subtitle?: string;
  type: "playlist";
  image: Quality;
  url: string;
  explicit?: boolean;
  count?: number;
  first_name?: string;
  language?: string;
  listname?: string;
};

export type TopShows = A<TopShow> & {
  trending_podcasts: TrendingPodcasts[];
};

export type TopShow = {
  id: string;
  name: string;
  subtitle: string;
  type: "show";
  image: Quality;
  url: string;
  explicit: boolean;
  season_number: number;
  release_date: string;
  badge: string;
};

export type TrendingPodcasts = {
  items: {
    id: string;
    name: string;
    subtitle: string;
    type: "show";
    image: Quality;
    url: string;
    explicit: boolean;
  }[];
  module: {
    source: string;
    title: string;
    subtitle: string;
  };
};

export type TopArtist = {
  id: string;
  name: string;
  image: Quality;
  url: string;
  follower_count: number;
  is_followed: boolean;
}[];

export type TopAlbum = A<Song | Album>;

export type Radio = {
  id: string;
  name: string;
  subtitle: string;
  type: "radio_station";
  image: Quality;
  url: string;
  explicit: boolean;
  color?: string;
  description?: string;
  featured_station_type: Type;
  language: string;
  query?: string;
  station_display_text: string;
};

export type Mix = {
  id: string;
  name: string;
  subtitle: string;
  header_desc: string;
  type: "mix";
  url: string;
  image: Quality;
  language: string;
  year: number;
  play_count: number;
  explicit: boolean;
  list_count: number;
  list_type: string;
  songs: Song[];
  user_id: string;
  last_updated: string;
  username: string;
  firstname: string;
  lastname: string;
  is_followed: boolean;
  share: number;
};

export type Label = {
  id: string;
  name: string;
  image: Quality;
  top_songs: {
    songs: Song[];
    total: number;
  };
  top_albums: {
    albums: Album[];
    total: number;
  };
  urls: {
    albums: string;
    songs: string;
  };
  available_languages: string[];
};
