import type { ArtistMini } from "./artist";

export type Type =
  | "artist"
  | "album"
  | "playlist"
  | "radio"
  | "radio_station"
  | "song"
  | "channel"
  | "mix"
  | "show"
  | "episode"
  | "season"
  | "label";

// Raw JioSaavn responses return a single image URL, not a quality map.
export type Quality = string;

export type ImageQuality = "low" | "medium" | "high";

export type StreamQuality = "poor" | "low" | "medium" | "high" | "excellent";

export type Rights = {
  code: unknown;
  cacheable: unknown;
  delete_cached_object: unknown;
  reason: unknown;
};

export type Lang =
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

export type Category = "latest" | "alphabetical" | "popularity";

export type Sort = "asc" | "desc";

export type Queue = {
  id: string;
  title: string;
  subtitle: string;
  perma_url: string;
  type: "song" | "episode";
  image: string;
  artists: ArtistMini[];
  download_url: string;
  duration: string;
};

export type QualitiesMap = {
  quality: StreamQuality;
  bitrate: string;
};

export const QUALITIES_MAP: QualitiesMap[] = [
  { quality: "poor", bitrate: "12kbps" },
  { quality: "low", bitrate: "48kbps" },
  { quality: "medium", bitrate: "96kbps" },
  { quality: "high", bitrate: "160kbps" },
  { quality: "excellent", bitrate: "320kbps" },
];
