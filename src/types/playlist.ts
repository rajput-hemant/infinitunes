import type { ArtistMini } from "./artist";
import type { Quality } from "./misc";
import type { Song } from "./song";

export type Playlist = {
  id: string;
  name: string;
  subtitle: string;
  header_desc: string;
  type: "playlist";
  url: string;
  image: Quality;
  language: string;
  year?: number;
  play_count?: number;
  explicit: boolean;
  list_count?: number;
  list_type: string;
  user_id: string;
  is_dolby_content: boolean;
  last_updated?: string;
  username: string;
  firstname: string;
  lastname: string;
  follower_count?: number;
  fan_count?: number;
  share?: number;
  video_count?: number;
  artists?: ArtistMini[];
  subtitle_desc: string[];
  songs?: Song[];
  modules?: PlaylistModules;
};

export type PlaylistModules = {
  related_playlist: {
    source: string;
    position: number;
    title: string;
    subtitle: string;
    params: { id: string };
  };
  currently_trending_playlists: {
    source: string;
    position: number;
    title: string;
    subtitle: string;
    params: { type: string; lang: string };
  };
  artists: {
    source: string;
    position: number;
    title: string;
    subtitle: string;
  };
};
