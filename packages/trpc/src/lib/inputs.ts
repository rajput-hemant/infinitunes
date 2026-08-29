import { z } from "zod";

const lang = z.string().optional();
const page = z.coerce.number().optional();
const n = z.coerce.number().optional();

export const homeInput = z.object({
  lang,
});

export const songInput = z.object({
  id: z.string().optional(),
  token: z.string().optional(),
  link: z.string().optional(),
  lang,
});

export const songRecommendInput = z.object({
  id: z.string(),
  lang,
});

export const albumInput = z.object({
  id: z.string().optional(),
  token: z.string().optional(),
  link: z.string().optional(),
  lang,
});

export const albumRecommendInput = z.object({
  id: z.string(),
  lang,
});

export const albumSameYearInput = z.object({
  year: z.string(),
  lang,
});

export const playlistInput = z.object({
  id: z.string().optional(),
  token: z.string().optional(),
  link: z.string().optional(),
  lang,
});

export const playlistRecommendInput = z.object({
  id: z.string(),
  lang,
});

export const artistInput = z.object({
  id: z.string().optional(),
  token: z.string().optional(),
  link: z.string().optional(),
  page: z.coerce.number().default(0),
  n_song: z.coerce.number().default(10),
  n_album: z.coerce.number().default(10),
  lang,
});

export const artistSongsAlbumsInput = z.object({
  id: z.string(),
  page,
  cat: z.string().optional(),
  sort: z.string().optional(),
  lang,
});

export const artistTopSongsInput = z.object({
  artist_id: z.string(),
  song_id: z.string(),
  page: z.coerce.number().default(1),
  cat: z.string().optional(),
  sort: z.string().optional(),
  lang,
});

export const showInput = z.object({
  token: z.string().optional(),
  link: z.string().optional(),
  season: z.coerce.number().optional(),
  sort: z.string().optional(),
});

export const showEpisodesInput = z.object({
  id: z.string(),
  season: z.coerce.number().optional(),
  page,
  sort: z.string().optional(),
});

export const searchTopInput = z.object({});

export const searchAllInput = z.object({
  q: z.string(),
});

export const searchByTypeInput = z.object({
  type: z.enum(["songs", "albums", "playlists", "artists", "podcasts"]),
  q: z.string(),
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
  actor_id: z.string(),
  song_id: z.string(),
  lang,
});

export const getFooterInput = z.object({
  lang: z.string(),
  page,
  n,
});

export const getLyricsInput = z.object({
  id: z.string(),
});

export const getMixInput = z.object({
  token: z.string().optional(),
  link: z.string().optional(),
  page,
  n: z.coerce.number().default(20),
  lang,
});

export const getLabelInput = z.object({
  token: z.string().optional(),
  link: z.string().optional(),
  page,
  n_song: z.coerce.number().default(10),
  n_album: z.coerce.number().default(10),
  cat: z.string().optional(),
  sort: z.string().optional(),
  lang,
});

export const getMegaMenuInput = z.object({
  entity: z.stringbool().optional(),
  lang,
});
