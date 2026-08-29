import type { ArtistMap } from "./artist";
import type { Lang, Rights } from "./misc";

export type SongObj = {
  songs: Song[];
  modules?: SongModules;
};

export type Song = {
  id: string;
  title: string;
  subtitle: string;
  header_desc: string;
  type: "song";
  perma_url: string;
  image: string;
  language: string;
  year: string;
  play_count: string | number;
  explicit_content: string;
  list_count: string;
  list_type: string;
  list: string;
  more_info: {
    music: string;
    song?: string;
    album_id: string;
    album: string;
    label: string;
    origin: string;
    is_dolby_content: boolean;
    "320kbps": string;
    encrypted_media_url: string;
    encrypted_cache_url: string;
    album_url: string;
    duration: string;
    rights: Rights;
    cache_state: string;
    has_lyrics: string;
    lyrics_snippet: string;
    starred: string;
    copyright_text: string;
    artistMap: ArtistMap;
    release_date?: string;
    label_url: string;
    vcode: string;
    vlink: string;
    triller_available: boolean;
    request_jiotune_flag: boolean;
    webp: string;
    lyrics_id: string;
    /** Injected server-side by `withDownloadUrl`, decrypted from `encrypted_media_url`. Not part of the raw upstream shape. */
    download_url?: string;
  };
  /** Injected server-side by `withDownloadUrl`, decrypted from `more_info.encrypted_media_url`. Not part of the raw upstream shape. */
  download_url?: string;
};

export type SongModules = {
  reco: {
    title: string;
    subtitle: string;
    source: string;
    position: number;
    source_params: {
      pid: string;
      language: Lang;
    };
  };
  currentlyTrending: {
    title: string;
    subtitle: string;
    source: string;
    position: number;
    source_params: {
      entity_type: string;
      entity_language: Lang;
    };
  };
  songsBysameArtists: {
    title: string;
    subtitle: string;
    source: string;
    position: number;
    source_params: {
      artist_ids: string;
      song_id: string;
      language: Lang;
    };
  };
  songsBysameActors: {
    title: string;
    subtitle: string;
    source: string;
    position: number;
    source_params: {
      actor_ids: string;
      song_id: string;
      language: Lang;
    };
  };
  artists: {
    title: string;
    subtitle: string;
    source: string;
    position: number;
  };
};
