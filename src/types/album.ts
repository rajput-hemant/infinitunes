import type { Image } from "./image";
import type { Song } from "./song";

export type Album = {
  id: string;
  name: string;
  year: string;
  type: "album";
  playCount: string;
  language: string;
  explicitContent: string;
  primaryArtistsId: string;
  primaryArtists: string | AlbumArtist[];
  artists: AlbumArtist[];
  featuredArtists: AlbumArtist[];
  songCount: string;
  releaseDate: string;
  image: Image;
  url: string;
  songs: Song[];
};

export type AlbumArtist = {
  id: string;
  name: string;
  role: string;
  image: Image;
  type: string;
  url: string;
};
