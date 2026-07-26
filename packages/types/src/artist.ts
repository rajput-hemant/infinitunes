import type { Album } from "./album";
import type { ModuleMeta } from "./modules";
import type { Playlist } from "./playlist";
import type { Song } from "./song";

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

export type Artist = {
  artistId: string;
  name: string;
  subtitle: string;
  image: string;
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
  modules: Partial<{
    topSongs: ModuleMeta;
    latest_release: ModuleMeta;
    topAlbums: ModuleMeta;
    dedicated_artist_playlist: ModuleMeta;
    featured_artist_playlist: ModuleMeta;
    singles: ModuleMeta;
    similarArtists: ModuleMeta;
  }>;
};

export type SimilarArtist = {
  id: string;
  name: string;
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
  image: string;
  perma_url: string;
  type: "artist";
  name: string;
  role: string;
};

export type ArtistSong = Omit<Song, "more_info"> & {
  more_info: {
    query: string;
    text: string;
    music: string;
    song_count: string;
    artistMap: ArtistMap;
  };
};

export type ArtistSongsOrAlbums = {
  artistId: string;
  name: string;
  image: string;
  follower_count: string;
  type: "artist";
  isVerified: boolean;
  dominantLanguage: string;
  dominantType: string;
  topSongs?: Omit<ArtistTopSongsOrAlbums<Song>, "albums">;
  topAlbums?: Omit<ArtistTopSongsOrAlbums<Album>, "songs">;
};
