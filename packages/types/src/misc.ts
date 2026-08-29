import type { ArtistMini } from "./artist";

export type MediaType =
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

/** Raw JioSaavn images and (post-decryption) download links are a single templated URL string. */
export type Quality = string;

export type ImageQuality = "low" | "medium" | "high";

export type StreamQuality = "poor" | "low" | "medium" | "high" | "excellent";

export type Rights = {
  code: unknown;
  cacheable: unknown;
  delete_cached_object: unknown;
  reason: unknown;
};

export const LANGUAGES = [
  "hindi",
  "english",
  "punjabi",
  "tamil",
  "telugu",
  "marathi",
  "gujarati",
  "bengali",
  "kannada",
  "bhojpuri",
  "malayalam",
  "urdu",
  "haryanvi",
  "rajasthani",
  "odia",
  "assamese",
] as const;

export type Lang = (typeof LANGUAGES)[number];

/**
 * Extracts the trailing token from a JioSaavn perma_url.
 */
export function parseToken(url: string): string {
  return url.split("/").filter(Boolean).pop() ?? "";
}

export type Category = "latest" | "alphabetical" | "popularity";

export type Sort = "asc" | "desc";

export type Queue = {
  id: string;
  name: string;
  subtitle: string;
  url: string;
  type: "song" | "episode";
  image: Quality;
  artists: ArtistMini[];
  download_url: Quality;
  duration: number;
};

type QualitiesMap = {
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
