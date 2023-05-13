import type { Album } from "./album";
import type { Image } from "./image";
import type { Song } from "./song";

export type Artist = {
  id: string;
  name: string;
  url: string;
  role: string;
  image: Image;
  followerCount: string;
  fanCount: string;
  isVerified: boolean;
  dominantLanguage: string;
  dominantType: string;
  bio: string;
  dob: string;
  fb: string;
  twitter: string;
  wiki: string;
  availableLanguages: string[];
  isRadioPresent: boolean;
};

export type ArtistSong = {
  total: number;
  lastPage: boolean;
  results: Song[];
};

export type ArtistAlbum = {
  total: number;
  lastPage: boolean;
  results: Album[];
};
