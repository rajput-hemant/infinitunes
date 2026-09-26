import type { Album } from "@infinitunes/types";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { api } from "../lib/api";
import { endpoints } from "../lib/endpoints";
import {
  albumInput,
  albumRecommendInput,
  albumSameYearInput,
} from "../lib/inputs";
import { publicProcedure, router } from "../trpc";
import {
  hasIdentity,
  mapDownloadUrls,
  resolveNumericId,
  tokenFromLink,
} from "./utils";

export const albumRouter = router({
  details: publicProcedure
    .input(albumInput)
    .output(z.custom<Album>())
    .query(async ({ input }) => {
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
      if (!hasIdentity(result, "id")) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No album found, please check the id, link or token",
        });
      }
      mapDownloadUrls(result, "list");
      return result as Album;
    }),

  recommendations: publicProcedure
    .input(albumRecommendInput)
    .output(z.custom<Album[]>())
    .query(async ({ input }) => {
      const result = await api<Album[]>(endpoints.album.recommend, {
        query: {
          albumid: input.id,
          language: input.lang,
        },
      });
      // Secondary list: no recommendations is not a missing album.
      return Array.isArray(result) ? result : [];
    }),

  sameYear: publicProcedure
    .input(albumSameYearInput)
    .output(z.custom<Album[]>())
    .query(async ({ input }) => {
      const result = await api<Album[]>(endpoints.album.same_year, {
        query: {
          album_year: input.year,
          album_lang: input.lang,
        },
      });
      // Secondary list on the album page.
      return Array.isArray(result) ? result : [];
    }),
});
