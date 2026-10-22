import type { Album } from "./album";
import type { ArtistMap, ArtistMini } from "./artist";
import type { MediaType } from "./misc";
import type { Song } from "./song";

type PlaylistSearchItem = {
  id: string;
  title: string;
  subtitle: string;
  type: "playlist";
  image: string;
  perma_url: string;
  explicit_content: string;
  more_info: Partial<{
    uid: string;
    firstname: string;
    lastname: string;
    artist_name: string[] | null;
    entity_type: string;
    entity_sub_type: string;
    video_available: boolean;
    is_dolby_content: boolean | null;
    sub_types: string | null;
    song_count: string;
    language: string;
  }>;
};

type SearchResults<T> = {
  position: number;
  data: T[];
};

export type Search<T> = {
  total: number;
  start: number;
  results: T[];
};

export type TopSearch = {
  id: string;
  title: string;
  subtitle?: string;
  type: MediaType;
  image: string;
  perma_url: string;
  explicit_content: string;
  more_info: Partial<{
    album: string;
    artistMap: ArtistMap[] | unknown[];
    season_number: number;
  }>;
};

export type AllSearch = {
  albums: SearchResults<{
    id: string;
    title: string;
    subtitle: string;
    type: "album";
    image: string;
    perma_url: string;
    explicit_content: string;
    description: string;
    more_info: {
      music: string;
      ctr: number;
      year: string;
      is_movie: string;
      language: string;
      song_pids: string;
    };
  }>;
  songs: SearchResults<{
    id: string;
    title: string;
    subtitle: string;
    type: "song";
    image: string;
    perma_url: string;
    explicit_content: string;
    description: string;
    more_info: {
      album: string;
      album_id: string;
      ctr: number;
      score: string;
      vcode?: string;
      vlink?: string;
      primary_artists: string;
      singers: string;
      video_available: boolean | null;
      triller_available: boolean;
      language: string;
    };
  }>;
  playlists: SearchResults<PlaylistSearchItem & { description: string }>;
  artists: SearchResults<{
    id: string;
    title: string;
    image: string;
    extra: string;
    type: "artist";
    description: string;
    ctr: number;
    entity: number;
    isRadioPresent: boolean;
    position: number;
  }>;
  topquery: SearchResults<{
    id: string;
    title: string;
    image: string;
    extra: string;
    type: MediaType;
    description: string;
    ctr: number;
    entity: number;
    isRadioPresent: boolean;
    position: number;
  }>;
  shows: SearchResults<{
    id: string;
    title: string;
    subtitle: string;
    type: "show";
    image: string;
    perma_url: string;
    explicit_content: string;
    description: string;
    more_info: { season_number: number };
  }>;
  episodes: SearchResults<unknown>;
};

export type SongSearch = Search<Song>;

export type AlbumSearch = Search<Album>;

export type PlaylistSearch = Search<PlaylistSearchItem>;

export type ArtistSearch = Search<{
  id: string;
  name: string;
  ctr: number;
  entity: number;
  image: string;
  role: string;
  perma_url: string;
  type: "artist";
  isRadioPresent: boolean;
  is_followed: boolean;
}>;

type PodcastSearchItem = {
  id: string;
  title: string;
  subtitle: string;
  type: "show";
  image_file_url: string;
  square_image_url: string;
  partner_name: string;
  label_name: string;
  explicit_content: number;
  song_info: string;
  latest_season_sequence: number;
  artists: ArtistMini[];
  featured_artists: ArtistMini[];
  primary_artists: ArtistMini[];
  perma_url: string;
};

export type PodcastSearch = Search<PodcastSearchItem>;

export type SearchReturnType =
  | SongSearch
  | AlbumSearch
  | PlaylistSearch
  | ArtistSearch
  | PodcastSearch;

/**
 * One entry of a `search.all` group, whose upstream item types differ per
 * group. Artists (and the top query) carry no `perma_url`.
 */
export type SearchItem = {
  id: string;
  title: string;
  subtitle?: string;
  extra?: string;
  /** The kind in words ("Artist"); `extra` is then the raw role ("primary"). */
  description?: string;
  perma_url?: string;
  type: MediaType;
  image: string;
  /** Credits: songs carry `singers`/`primary_artists`, albums `music`. */
  more_info?: { singers?: string; primary_artists?: string; music?: string };
};

function isSearchItem(value: unknown): value is SearchItem {
  if (typeof value !== "object" || value === null) return false;
  return (
    "id" in value &&
    typeof value.id === "string" &&
    "title" in value &&
    typeof value.title === "string" &&
    "type" in value &&
    typeof value.type === "string" &&
    "image" in value &&
    typeof value.image === "string"
  );
}

/** A group's entries; the upstream `episodes` group is untyped, so each is checked. */
export function getSearchItems(
  group: AllSearch[keyof AllSearch],
): SearchItem[] {
  const entries: readonly unknown[] = group.data;
  return entries.filter(isSearchItem);
}
