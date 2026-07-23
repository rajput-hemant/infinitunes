import { TRPCError } from "@trpc/server";

import { api } from "../lib/api";
import { endpoints } from "../lib/endpoints";
import { songInput, songRecommendInput } from "../lib/inputs";
import { publicProcedure, router } from "../trpc";
import { tokenFromLink, withDownloadUrl } from "./utils";

export const songRouter = router({
  details: publicProcedure.input(songInput).query(async ({ input }) => {
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
    const result = await api(endpoints.song.id, {
      query: {
        pids: id,
        token: token || tokenFromLink(link ?? ""),
        type: "song",
      },
      language: lang,
    });
    if (!("songs" in (result as Record<string, unknown>))) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Song not found, please check the id, link or token",
      });
    }
    const payload = result as { songs: Record<string, unknown>[] };
    payload.songs = payload.songs.map(withDownloadUrl);
    return result;
  }),

  recommendations: publicProcedure
    .input(songRecommendInput)
    .query(async ({ input }) => {
      const result = await api(endpoints.song.recommend, {
        query: {
          pid: input.id,
          language: input.lang,
        },
      });
      if (!Array.isArray(result) || result.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No recommendations found, please check the id",
        });
      }
      return result;
    }),
});
