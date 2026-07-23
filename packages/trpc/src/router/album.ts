import { TRPCError } from "@trpc/server";

import { api } from "../lib/api";
import { endpoints } from "../lib/endpoints";
import {
  albumInput,
  albumRecommendInput,
  albumSameYearInput,
} from "../lib/inputs";
import { publicProcedure, router } from "../trpc";
import { resolveNumericId, tokenFromLink, withDownloadUrl } from "./utils";

export const albumRouter = router({
  details: publicProcedure.input(albumInput).query(async ({ input }) => {
    const { id, token, link, lang } = input;
    if (!id && !link && !token) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Please provide album id, link or a token",
      });
    }
    if (link && !link.includes("album")) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Please provide a valid JioSaavn link",
      });
    }
    const t = token || tokenFromLink(link ?? "");
    const albumid = id ?? (await resolveNumericId(t, "album"));
    const result = await api(endpoints.album.id, {
      query: {
        albumid,
        token: t,
        type: "album",
      },
      language: lang,
    });
    const payload = result as { id?: string; list?: Record<string, unknown>[] };
    if (!payload.id) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No album found, please check the id, link or token",
      });
    }
    if (Array.isArray(payload.list))
      payload.list = payload.list.map(withDownloadUrl);
    return result;
  }),

  recommendations: publicProcedure
    .input(albumRecommendInput)
    .query(async ({ input }) => {
      const result = await api(endpoints.album.recommend, {
        query: {
          albumid: input.id,
          language: input.lang,
        },
      });
      return result;
    }),

  sameYear: publicProcedure
    .input(albumSameYearInput)
    .query(async ({ input }) => {
      const result = await api(endpoints.album.same_year, {
        query: {
          album_year: input.year,
          album_lang: input.lang,
        },
      });
      if (!Array.isArray(result) || result.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No albums found, please check the year",
        });
      }
      return result;
    }),
});
