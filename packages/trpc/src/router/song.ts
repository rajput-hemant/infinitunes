import type { Episode, Song, SongObj } from "@infinitunes/types";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { api } from "../lib/api";
import { endpoints } from "../lib/endpoints";
import { songInput, songItemsInput, songRecommendInput } from "../lib/inputs";
import { publicProcedure, router } from "../trpc";
import { isRecord, withDownloadUrl } from "./utils";

async function fetchSongObj(input: {
  id?: string;
  token?: string;
  lang?: string;
}): Promise<SongObj<Song | Episode>> {
  const { id, token, lang } = input;
  if (!id && !token) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Please provide song id(s) or a token",
    });
  }
  const endpoint = id ? endpoints.song.id : endpoints.song.link;
  const result = await api(endpoint, {
    query: {
      pids: id,
      token,
      type: "song",
    },
    language: lang,
  });
  if (!isRecord(result) || !Array.isArray(result.songs)) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Song not found, please check the id or token",
    });
  }
  result.songs = result.songs.map((item) => withDownloadUrl(item));
  return result as SongObj<Song | Episode>;
}

export const songRouter = router({
  // Song ids or a song token: the caller owns knowing these are songs.
  details: publicProcedure
    .input(songInput)
    .output(z.custom<SongObj>())
    .query(async ({ input }) => (await fetchSongObj(input)) as SongObj),

  // Upstream also resolves episode ids through the same endpoint.
  items: publicProcedure
    .input(songItemsInput)
    .output(z.custom<SongObj<Song | Episode>>())
    .query(({ input }) => fetchSongObj(input)),

  recommendations: publicProcedure
    .input(songRecommendInput)
    .output(z.custom<Song[]>())
    .query(async ({ input }) => {
      const result = await api(endpoints.song.recommend, {
        query: {
          pid: input.id,
          language: input.lang,
        },
      });
      // Recommendations are a secondary list: an empty upstream answer is a
      // valid "nothing to show", not a missing entity.
      if (!Array.isArray(result)) return [];
      return result.map((item) => withDownloadUrl(item)) as Song[];
    }),
});
