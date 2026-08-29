import type { Playlist } from "@infinitunes/types";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { api } from "../lib/api";
import { endpoints } from "../lib/endpoints";
import { playlistInput, playlistRecommendInput } from "../lib/inputs";
import { publicProcedure, router } from "../trpc";
import { resolveNumericId, tokenFromLink, withDownloadUrl } from "./utils";

export const playlistRouter = router({
  details: publicProcedure
    .input(playlistInput)
    .output(z.custom<Playlist>())
    .query(async ({ input }) => {
      const { id, token, link, lang } = input;
      if (!id && !link && !token) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Please provide playlist id, link or a token",
        });
      }
      if (link && !link.includes("featured")) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Please provide a valid JioSaavn link",
        });
      }
      const t = token || tokenFromLink(link ?? "");
      const listid = id ?? (await resolveNumericId(t, "playlist"));
      const result = await api<Playlist>(endpoints.playlist.id, {
        query: {
          listid,
          token: t,
          type: "playlist",
          p: "1",
          n: "50",
        },
        language: lang,
      });
      const payload = result as unknown as {
        id?: string;
        list?: Record<string, unknown>[];
      };
      if (!payload.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No playlist found, please check the id, link or token",
        });
      }
      if (Array.isArray(payload.list))
        payload.list = payload.list.map(withDownloadUrl);
      return result;
    }),

  recommendations: publicProcedure
    .input(playlistRecommendInput)
    .output(z.custom<Playlist[]>())
    .query(async ({ input }) => {
      const result = await api<Playlist[]>(endpoints.playlist.recommend, {
        query: {
          listid: input.id,
          language: input.lang,
        },
      });
      // Secondary list: no recommendations is not a missing playlist.
      return Array.isArray(result) ? result : [];
    }),
});
