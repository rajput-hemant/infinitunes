import { z } from "zod";

const lang = z.string().max(300).optional();
const page = z.coerce.number().int().min(0).max(1000).optional();
const n = z.coerce.number().int().min(1).max(100).optional();

export const songInput = z.object({
  id: z.string().max(200).optional(),
  token: z.string().max(200).optional(),
  lang,
});

/** Comma-separated ids that may name songs or episodes. */
export const songItemsInput = z.object({
  id: z.string().max(1000),
  lang,
});

export const songRecommendInput = z.object({
  id: z.string().max(200),
  lang,
});

export const albumInput = z.object({
  id: z.string().max(200).optional(),
  token: z.string().max(200).optional(),
  lang,
});

export const albumRecommendInput = z.object({
  id: z.string().max(200),
  lang,
});

export const albumSameYearInput = z.object({
  year: z.string().regex(/^\d{4}$/),
  lang,
});

export const playlistInput = z.object({
  id: z.string().max(200).optional(),
  token: z.string().max(200).optional(),
  lang,
});

export const playlistRecommendInput = z.object({
  id: z.string().max(200),
  lang,
});

export const artistInput = z.object({
  id: z.string().max(200).optional(),
  token: z.string().max(200).optional(),
  page: z.coerce.number().int().min(0).max(1000).default(0),
  n_song: z.coerce.number().int().min(1).max(100).default(10),
  n_album: z.coerce.number().int().min(1).max(100).default(10),
  lang,
});

export const artistSongsAlbumsInput = z.object({
  id: z.string().max(200),
  page,
  cat: z.string().max(200).optional(),
  sort: z.string().max(200).optional(),
  lang,
});

export const artistTopSongsInput = z.object({
  artist_id: z.string().max(200),
  song_id: z.string().max(200),
  page: z.coerce.number().int().min(0).max(1000).default(1),
  cat: z.string().max(200).optional(),
  sort: z.string().max(200).optional(),
  lang,
});

export const showInput = z.object({
  token: z.string().max(200).optional(),
  season: z.coerce.number().int().min(1).max(100).optional(),
  sort: z.string().max(200).optional(),
});

export const showEpisodesInput = z.object({
  id: z.string().max(200),
  season: z.coerce.number().int().min(1).max(100).optional(),
  page,
  sort: z.string().max(200).optional(),
});

export const searchAllInput = z.object({
  q: z.string().max(200),
});

export const searchByTypeInput = z.object({
  type: z.enum(["songs", "albums", "playlists", "artists", "podcasts"]),
  q: z.string().max(200),
  page,
  n,
});

export const getTrendingInput = z.object({
  type: z.enum(["song", "album", "playlist"]).optional(),
  lang,
});

export const getPagedInput = z.object({
  page,
  n,
  lang,
});

export const getActorTopSongsInput = z.object({
  actor_id: z.string().max(200),
  song_id: z.string().max(200),
  lang,
});

export const getFooterInput = z.object({
  lang,
  page,
  n,
});

export const getLyricsInput = z.object({
  id: z.string().max(200),
});

export const getMixInput = z.object({
  token: z.string().max(200).optional(),
  page,
  n: z.coerce.number().int().min(1).max(100).default(20),
  lang,
});

export const getLabelInput = z.object({
  token: z.string().max(200).optional(),
  page,
  n_song: z.coerce.number().int().min(1).max(100).default(10),
  n_album: z.coerce.number().int().min(1).max(100).default(10),
  cat: z.string().max(200).optional(),
  sort: z.string().max(200).optional(),
  lang,
});

export const getMegaMenuInput = z.object({
  entity: z.stringbool().optional(),
  lang,
});

export const createStationInput = z.object({
  type: z.enum(["featured", "artist", "song"]).default("featured"),
  name: z.string().max(200),
  language: z.string().max(300).optional(),
  artistId: z.string().max(200).optional(),
  query: z.string().max(200).optional(),
  mode: z.string().max(200).optional(),
});

export const radioSongsInput = z.object({
  stationId: z.string().max(200),
  k: z.coerce.number().int().min(1).max(50).default(20),
  next: z.coerce.number().int().min(0).max(1000).optional(),
  lang,
});

export const stationDetailsInput = z.object({
  name: z.string().max(200).optional(),
  token: z.string().max(200),
  lang,
});
