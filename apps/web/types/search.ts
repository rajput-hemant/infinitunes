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
  title: string;
  subtitle: string;
  type: Type;
  image: Quality;
  perma_url: string;
  explicit_content: string;
  more_info: {
    album: string;
    artistMap: ArtistMap[];
  };
};

export type AllSearch = {
  albums: A<{
    id: string;
    title: string;
    subtitle: string;
    image: Quality;
    music: string;
    perma_url: string;
    type: "album";
    position: number;
    more_info: {
      year: string;
      is_movie: string;
      language: string;
      song_pids: string;
    };
  }>;
  songs: A<{
    id: string;
    title: string;
    image: Quality;
    album: string;
    perma_url: string;
    type: "song";
    position: number;
    more_info: {
      vcode?: string;
      vlink?: string;
      primary_artists: string;
      singers: string;
      video_available: boolean;
      triller_available: boolean;
      language: string;
    } | null;
  }>;
  playlists: A<{
    id: string;
    title: string;
    image: Quality;
    extra: string;
    perma_url: string;
    language: string;
    type: "playlist";
    position: number;
    more_info: {
      firstname: string;
      artist_name: string;
      entity_type: string;
      entity_sub_type: string;
      video_available: boolean;
      is_dolby_content: boolean;
      sub_types: string;
      lastname: string;
      language: string;
    } | null;
  }>;
  artists: A<{
    id: string;
    title: string;
    image: Quality;
    extra: string;
    perma_url: string;
    type: "artist";
    subtitle: string;
    entity: number;
    position: number;
  }>;
  topquery: A<AllSearch["songs"]["data"][0]>;
  shows: A<{
    id: string;
    title: string;
    image: Quality;
    type: "show";
    season_number: number;
    subtitle: string;
    perma_url: string;
    position: number;
  }>;
  episodes: A<unknown>;
};

export type SongSearch = Search<Song>;

export type AlbumSearch = Search<Album>;

export type PlaylistSearch = Search<Playlist>;

export type ArtistSearch = Search<{
  id: string;
  title: string;
  subtitle: string;
  type: "artist";
  ctr: number;
  entity: number;
  image: Quality;
  role: string;
  perma_url: string;
  isRadioPresent: boolean;
  is_followed: boolean;
}>;

export type PodcastSearch = Search<{
  id: string;
  type: string;
  title: string;
  image: Quality;
  partner_name: string;
  label_name: string;
  explicit_content: number;
  season: number;
  artists: ArtistMini[];
  featured_artists: ArtistMini[];
  primary_artists: ArtistMini[];
  perma_url: string;
  subtitle: string;
}>;

export type SearchReturnType =
  | SongSearch
  | AlbumSearch
  | PlaylistSearch
  | ArtistSearch
  | PodcastSearch;
