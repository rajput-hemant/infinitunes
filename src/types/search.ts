import type { Album } from "./album";
import type { ArtistMap, ArtistMini } from "./artist";
import type { Quality, Type } from "./misc";
import type { Playlist } from "./playlist";
import type { Song } from "./song";

type A<T> = {
  position: number;
  data: T[];
};

export type Search<T> = {
  total: number;
  start: number;
  results: T[];
};

export type TopSearch = {
  id: string;
  name: string;
  subtitle: string;
  type: Type;
  image: Quality;
  url: string;
  explicit: boolean;
  album: string;
  artist_map: ArtistMap[];
};

export type AllSearch = {
  albums: A<{
    id: string;
    name: string;
    subtitle: string;
    image: Quality;
    music: string;
    url: string;
    type: "album";
    position: number;
    year: number;
    is_movie: boolean;
    language: string;
    song_pids: string;
  }>;
  songs: A<{
    id: string;
    name: string;
    subtitle: string;
    image: Quality;
    album: string;
    url: string;
    type: "song";
    position: number;
    primary_artists: string;
    singers: string;
    language: string;
  }>;
  playlists: A<{
    id: string;
    name: string;
    subtitle: string;
    image: Quality;
    extra: string;
    url: string;
    language: string;
    type: "playlist";
    position: number;
    firstname: string;
    lastname: string;
    artist_name: string;
    entity_type: string;
    entity_sub_type: string;
    is_dolby_content: boolean;
    sub_types: string;
  }>;
  artists: A<{
    id: string;
    name: string;
    image: Quality;
    extra: string;
    url: string;
    type: "artist";
    subtitle: string;
    entity: number;
    position: number;
  }>;
  top_query: A<
    AllSearch["songs"]["data"][0] & {
      type: Type;
    }
  >;
  shows: A<{
    id: string;
    name: string;
    image: Quality;
    type: "show";
    season_number: number;
    subtitle: string;
    url: string;
    position: number;
  }>;
  // episodes: A<unknown>;
};

export type SongSearch = Search<Song>;

export type AlbumSearch = Search<Album>;

export type PlaylistSearch = Search<Playlist>;

export type ArtistSearch = Search<{
  id: string;
  name: string;
  subtitle: string;
  type: "artist";
  ctr: number;
  entity: number;
  image: Quality;
  role: string;
  url: string;
  is_radio_present: boolean;
  is_followed: boolean;
}>;

export type PodcastSearch = Search<{
  id: string;
  name: string;
  subtitle: string;
  type: "show";
  image: Quality;
  partner_name: string;
  label_name: string;
  explicit: boolean;
  season: number;
  artists: ArtistMini[];
  featured_artists: ArtistMini[];
  primary_artists: ArtistMini[];
  url: string;
}>;

export type SearchReturnType =
  | SongSearch
  | AlbumSearch
  | PlaylistSearch
  | ArtistSearch
  | PodcastSearch;
