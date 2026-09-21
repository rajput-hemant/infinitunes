import type { Song, SongObj } from "@infinitunes/types";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { api } from "../lib/api";
import { endpoints } from "../lib/endpoints";
import { songInput, songRecommendInput } from "../lib/inputs";
import { publicProcedure, router } from "../trpc";
import { isRecord, tokenFromLink, withDownloadUrl } from "./utils";

export const songRouter = router({
  details: publicProcedure
    .input(songInput)
    .output(z.custom<SongObj>())
    .query(async ({ input }) => {
      const { id, token, link, lang } = input;
      if (!id && !link && !token) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Please provide song id(s), link or a token",
        });
      }
      if (link && !link.includes("song")) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Please provide a valid JioSaavn link",
        });
      }
      const t = token || tokenFromLink(link ?? "");
      const endpoint = id ? endpoints.song.id : endpoints.song.link;
      const result = await api(endpoint, {
        query: {
          pids: id,
          token: t,
          type: "song",
        },
        language: lang,
      });
      if (!isRecord(result) || !Array.isArray(result.songs)) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Song not found, please check the id, link or token",
        });
      }
      result.songs = result.songs.map((item) => withDownloadUrl(item));
      return result as SongObj;
    }),

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
