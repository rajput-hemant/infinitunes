import type { Album } from "./album";
import type { Quality } from "./misc";
import type { Playlist } from "./playlist";
import type { Song } from "./song";

export type Artist = {
  id: string;
  name: string;
  subtitle: string;
  image: Quality;
  follower_count: number;
  type: "artist";
  is_verified: boolean;
  dominant_language: string;
  dominant_type: string;
  top_songs: Song[];
  top_albums: Album[];
  dedicated_artist_playlist: Playlist[];
  featured_artist_playlist: Playlist[];
  singles: ArtistSong[];
  latest_release: ArtistSong[];
  similar_artists: SimilarArtist[];
  is_radio_present: boolean;
  bio: {
    title: string;
    text: string;
    sequence: number;
  }[];
  dob: string;
  fb: string;
  twitter: string;
  wiki: string;
  urls: Urls;
  available_languages: string[];
  fan_count: number;
  is_followed: boolean;
  modules: {
    top_songs: Module;
    latest_release: Module;
    top_albums: Module;
    dedicated_artist_playlist: Module;
    featured_artist_playlist: Module;
    singles: Module;
    similar_artists: Module;
  };
};

export type SimilarArtist = {
  id: string;
  name: string;
  roles: { [K: string]: string };
  aka: string;
  fb: string;
  twitter: string;
  wiki: string;
  similar: {
    id: string;
    name: string;
  }[];
  dob: string;
  image: Quality;
  search_keywords: string;
  primary_artist_id: string;
  languages: { [K: string]: string };
  url: string;
  type: "artist";
  is_radio_present: boolean;
  dominant_type: string;
};

export type ArtistMap = {
  primary_artists: ArtistMini[];
  featured_artists: ArtistMini[];
  artists: ArtistMini[];
};

export type ArtistMini = {
  id: string;
  image: Quality;
  url: string;
  name: string;
  type: "artist";
  role: string;
};

export type ArtistSong = Pick<
  Song,
  | "id"
  | "name"
  | "subtitle"
  | "type"
  | "url"
  | "image"
  | "language"
  | "year"
  | "play_count"
  | "explicit"
  | "list_count"
  | "list_type"
  | "music"
  | "artist_map"
> & {
  query: string;
  text: string;
  song_count: number;
};

export type ArtistSongsOrAlbums = {
  id: string;
  name: string;
  image: Quality;
  follower_count: number;
  type: "artist";
  is_verified: boolean;
  dominant_language: string;
  dominant_type: string;
  top_songs: Omit<ArtistTopSongsOrAlbums<Song>, "albums">;
  top_albums: Omit<ArtistTopSongsOrAlbums<Album>, "songs">;
};

type Module = {
  title: string;
  subtitle: string;
  source: string;
  position: number;
};

export type Urls = {
  albums: string;
  bio: string;
  comments: string;
  songs: string;
};

export type ArtistTopSongsOrAlbums<T> = {
  total: number;
  last_page: boolean;
  songs: T[];
  albums: T[];
};
