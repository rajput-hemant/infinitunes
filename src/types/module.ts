import type { Album } from "./album";
import type { Image } from "./image";
import type { Song } from "./song";

export type Modules = {
  albums: Album[];
  charts: Chart[];
  trending: Trending;
  playlists: PlaylistT[];
};

export type Langs =
  | "hindi"
  | "english"
  | "punjabi"
  | "tamil"
  | "telugu"
  | "marathi"
  | "gujarati"
  | "bengali"
  | "kannada"
  | "bhojpuri"
  | "malayalam"
  | "urdu"
  | "haryanvi"
  | "rajasthani"
  | "odia"
  | "assamese";

export type PlaylistT = {
  id: string;
  title: string;
  subtitle: string;
  type: "PlaylistT";
  image: Image;
  url: string;
  songCount: string;
  firstname: string;
  followerCount: string;
  lastUpdated: string;
  userId: string;
  explicitContent: string;
};

export type Trending = {
  songs: Omit<
    Song,
    | "primaryArtistsId"
    | "featuredArtistsId"
    | "hasLyrics"
    | "copyright"
    | "downloadUrl"
  >[];
  albums: Album[];
};

export type TrendingT =
  | Omit<
      Song,
      | "primaryArtistsId"
      | "featuredArtistsId"
      | "hasLyrics"
      | "copyright"
      | "downloadUrl"
    >
  | Omit<Album, "songs" | "primaryArtistsId">;

export type Chart = {
  id: string;
  title: string;
  subtitle: string;
  type: "PlaylistT";
  image: Image;
  url: string;
  firstname: string;
  explicitContent: string;
  language: string;
};
