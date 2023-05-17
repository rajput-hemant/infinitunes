import type { Image } from "./image";
import type { Song } from "./song";

export type Playlist = {
  id: string;
  type: "playlist";
  userId: string;
  name: string;
  songCount: string;
  fanCount: string;
  followerCount: string;
  username: string;
  firstname: string;
  language: string;
  lastname: string;
  shares: string;
  image: Image;
  url: string;
  songs: Song[];
};
