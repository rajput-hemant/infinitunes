import { Album, Artist, Playlist, Song } from ".";
import type { Image } from "./image";

type Search<T> = {
  results: T;
  position: number;
};

export type AllSearch = {
  albums: Search<SearchAlbum[]>;
  songs: Search<SearchSong[]>;
  artists: Search<SearchArtist[]>;
  playlists: Search<SearchPlaylist[]>;
  topQuery: Search<SearchTopQuery[]>;
};

type SearchAlbum = {
  id: string;
  title: string;
  image: Image;
  artist: string;
  url: string;
  type: string;
  description: string;
  position: number;
  year: string;
  language: string;
  songIds: string;
};

type SearchSong = {
  id: string;
  title: string;
  image: Image;
  album: string;
  url: string;
  type: string;
  description: string;
  position: number;
  primaryArtists: string;
  singers: string;
  language: string;
};

type SearchArtist = {
  id: string;
  title: string;
  image: Image;
  url: string;
  type: string;
  description: string;
  position: number;
};

type SearchPlaylist = {
  id: string;
  title: string;
  image: Image;
  url: string;
  language: string;
  type: string;
  description: string;
  position: number;
};

type SearchTopQuery = {
  id: string;
  title: string;
  image: Image;
  album: string;
  url: string;
  type: string;
  description: string;
  position: number;
  primaryArtists: string;
  singers: string;
  language: string;
};

export type SongSearch = {
  total: number;
  start: number;
  results: Song[];
};

export type AlbumSearch = {
  total: number;
  start: number;
  results: Album[];
};

export type ArtistSearch = {
  total: number;
  start: number;
  results: Artist[];
};

export type PlaylistSearch = {
  total: number;
  start: number;
  results: Playlist[];
};
