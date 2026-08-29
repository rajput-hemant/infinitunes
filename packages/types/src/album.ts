import type { ArtistMap } from "./artist";
import type { MediaType } from "./misc";
import type { Song } from "./song";

export type AlbumModules = {
  reco: {
    source: string;
    position: number;
    title: string;
    subtitle: string;
    source_params: { albumid: string };
  };
  currentlyTrending: {
    source: string;
    position: number;
    title: string;
    subtitle: string;
    source_params: { entity_type: string; entity_language: string };
  };
  topAlbumsFromSameYear: {
    source: string;
    position: number;
    title: string;
    subtitle: string;
    source_params: { album_year: string; album_lang: string };
  };
  artists: {
    source: string;
    position: number;
    title: string;
    subtitle: string;
  };
};

export type Album = {
  id: string;
  title: string;
  subtitle: string;
  type: "album";
  image: string;
  perma_url: string;
  header_desc: string;
  explicit_content: string;
  language: string;
  year: string;
  play_count: string;
  list_count: string;
  list_type: MediaType;
  list?: string | Song[];
  more_info: Partial<{
    artistMap: ArtistMap;
    song_count: string;
    copyright_text: string;
    is_dolby_content: boolean;
    label_url: string;
  }>;
  modules?: AlbumModules;
};
