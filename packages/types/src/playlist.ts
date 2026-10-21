import type { ArtistMini } from "./artist";
import type { Song } from "./song";

export type PlaylistModules = {
  relatedPlaylist: {
    source: string;
    position: number;
    title: string;
    subtitle: string;
    source_params: { listid: string };
  };
  currentlyTrendingPlaylists: {
    source: string;
    position: number;
    title: string;
    subtitle: string;
    source_params: { entity_type: string; entity_language: string };
  };
  artists: {
    source: string;
    position: number;
    title: string;
    subtitle: string;
  };
};

export type Playlist = {
  id: string;
  title: string;
  subtitle: string;
  header_desc?: string;
  type: "playlist";
  perma_url: string;
  image: string;
  language: string;
  year?: string;
  play_count?: string;
  explicit_content: string;
  list_count?: string;
  list_type: string;
  list?: string | Song[];
  more_info: {
    uid: string;
    is_dolby_content: boolean | null;
    last_updated?: string;
    username: string;
    firstname: string;
    lastname: string;
    follower_count?: string;
    fan_count?: string;
    playlist_type: string;
    share?: string;
    video_count?: string;
    artists?: ArtistMini[];
    subtitle_desc: string[];
  };
  /** `null` on playlists inside lists (home). */
  modules?: PlaylistModules | null;
};

/**
 * A `playlist.recommendations` entry: a card-sized playlist whose
 * `more_info` is only partly filled (often just `firstname`).
 */
export type RelatedPlaylist = Omit<Playlist, "more_info"> & {
  more_info: Partial<Playlist["more_info"]>;
};

/** Length limits for a user playlist; the web form and the tRPC router both enforce them. */
export const PLAYLIST_NAME_MAX = 100;
export const PLAYLIST_DESCRIPTION_MAX = 255;
