import type { AlbumArtist } from "./album";
import type { Image } from "./image";

export type Song = {
  id: string;
  name: string;
  type: "song";
  album: {
    id: string;
    name: string;
    url: string;
  };
  year: string;
  releaseDate: string;
  duration: string;
  label: string;
  primaryArtists: string | AlbumArtist[];
  primaryArtistsId: string;
  featuredArtists: string | AlbumArtist[];
  featuredArtistsId: string;
  explicitContent: string;
  playCount: string;
  language: string;
  hasLyrics: string;
  url: string;
  copyright: string;
  image: Image;
  downloadUrl: { quality: string; link: string }[];
};
