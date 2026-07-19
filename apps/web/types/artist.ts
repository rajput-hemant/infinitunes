import type { Album } from "./album";
import type { Quality, Type } from "./misc";
import type { Playlist } from "./playlist";
import type { Song } from "./song";

export type Artist = {
  artistId: string;
  title: string;
  subtitle: string;
  image: Quality;
  follower_count: string;
  type: "artist";
  isVerified: boolean;
  dominantLanguage: string;
  dominantType: string;
  topSongs?: Song[];
  topAlbums?: Album[];
  dedicated_artist_playlist?: Playlist[];
  featured_artist_playlist?: Playlist[];
  singles?: ArtistSong[];
  latest_release?: ArtistSong[];
  similarArtists: SimilarArtist[];
  isRadioPresent: boolean;
  bio: string;
  dob: string;
  fb: string;
  twitter: string;
  wiki: string;
  urls: Urls;
  availableLanguages: string[];
  fan_count: string;
  is_followed: boolean;
  modules?: {
    topSongs?: Module;
    latest_release?: Module;
    topAlbums?: Module;
    dedicated_artist_playlist?: Module;
    featured_artist_playlist?: Module;
    singles?: Module;
    similarArtists?: Module;
  };
};

export type SimilarArtist = {
  id: string;
  title: string;
  roles: string;
  aka: string;
  fb: string;
  twitter: string;
  wiki: string;
  similar: string;
  dob: string;
  image_url: string;
  search_keywords: string;
  primary_artist_id: string;
  combine_artist_pages: number;
  replace_with_primary_artists: number;
  languages: string;
  perma_url: string;
  type: "artist";
  isRadioPresent: boolean;
  dominantType: string;
};

export type ArtistMap = {
  primary_artists: ArtistMini[];
  featured_artists?: ArtistMini[];
  artists?: ArtistMini[];
};

export type ArtistMini = {
  id: string;
  image: Quality;
  perma_url: string;
  type: "artist";
  title: string;
  role: string;
};

export type ArtistSong = Pick<
  Song,
  | "id"
  | "title"
  | "subtitle"
  | "type"
  | "perma_url"
  | "image"
  | "language"
  | "year"
  | "play_count"
  | "explicit_content"
  | "list_count"
  | "list_type"
  | "music"
  | "more_info"
> & {
  query: string;
  text: string;
  song_count: string;
};

export type ArtistSongsOrAlbums = {
  artistId: string;
  title: string;
  image: Quality;
  follower_count: string;
  type: "artist";
  isVerified: boolean;
  dominantLanguage: string;
  dominantType: Type;
  topSongs?: Omit<ArtistTopSongsOrAlbums<Song>, "albums">;
  topAlbums?: Omit<ArtistTopSongsOrAlbums<Album>, "songs">;
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
