import type { Album } from "./album";
import type { MediaType } from "./misc";
import type { Playlist } from "./playlist";
import type { Song } from "./song";

type Paginated<T> = {
  count: number;
  last_page: boolean;
  data: T[];
};

type NavItem = {
  id: string;
  title: string;
  action: string;
};

export type FooterDetails = {
  playlist: NavItem[];
  artist: NavItem[];
  album: NavItem[];
  actor: NavItem[];
};

export type Lyrics = {
  lyrics: string;
  script_tracking_url: string;
  lyrics_copyright: string;
  snippet: string;
};

export type Trending = (Album | Song | Playlist)[];

export type FeaturedPlaylists = Paginated<Playlist>;

export type Chart = {
  id: string;
  title: string;
  subtitle?: string;
  type: "playlist";
  image: string;
  count?: number;
  language?: string;
  listname?: string;
  perma_url: string;
  explicit_content?: string;
  more_info?: Partial<{
    firstname: string;
    song_count: number;
  }>;
};

export type TopShows = Paginated<TopShow> & {
  trendingPodcasts: {
    items: {
      id: string;
      title: string;
      subtitle: string;
      type: "show";
      image: string;
      perma_url: string;
      explicit_content: string;
      more_info: { square_image?: string } | unknown[];
    }[];
    module: {
      source: string;
      title: string;
      subtitle: string;
    };
  }[];
};

export type TopShow = {
  id: string;
  title: string;
  subtitle: string;
  type: "show";
  image: string;
  perma_url: string;
  explicit_content: string;
  more_info: {
    season_number: string;
    release_date: string;
    year: string;
    badge: string;
    square_image: string;
  };
};

export type TopArtists = {
  top_artists: {
    artistid: string;
    name: string;
    image: string;
    follower_count: number;
    is_followed: boolean;
    perma_url: string;
  }[];
};

export type TopAlbum = Paginated<Song | Album>;

export type Radio = {
  explicit_content: string;
  id: string;
  image: string;
  perma_url: string;
  subtitle: string;
  title: string;
  type: "radio_station";
  more_info: {
    color?: string;
    description?: string;
    featured_station_type: MediaType;
    language: string;
    query?: string;
    station_display_text: string;
  };
};

export type Mix = {
  id: string;
  title: string;
  subtitle: string;
  header_desc: string;
  type: "mix";
  perma_url: string;
  image: string;
  language: string;
  year: string;
  play_count: string;
  explicit_content: string;
  list_count: string;
  list_type: string;
  list: Song[];
  more_info: {
    uid: string;
    last_updated: string;
    username: string;
    firstname: string;
    lastname: string;
    is_followed: string;
    playlist_type: string;
    share: string;
  };
  modules: {
    list: {
      source: string;
      position: number;
      score: string;
      bucket: string;
      scroll_type: string;
      title: string;
      subtitle: string;
      highlight: string;
      simpleHeader: boolean;
      noHeader: boolean;
      view_more: unknown[];
    };
  };
};

export type Label = {
  labelId: string;
  name: string;
  image: string;
  topSongs: {
    songs: Song[];
    total: number;
  };
  topAlbums: {
    albums: Album[];
    total: number;
  };
  urls: {
    albums: string;
    songs: string;
  };
  availableLanguages: string[];
};

export type MegaMenu = {
  mega_menu: {
    top_artists: MegaMenuItem[];
    top_playlists: MegaMenuItem[];
    new_releases: MegaMenuItem[];
  };
};

export type MegaMenuItem = {
  title: string;
  perma_url: string;
};
