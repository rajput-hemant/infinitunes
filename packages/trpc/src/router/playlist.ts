import type { Playlist, RelatedPlaylist } from "@infinitunes/types";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { endpoints } from "../lib/endpoints";
import { playlistInput, playlistRecommendInput } from "../lib/inputs";
import { publicProcedure, router } from "../trpc";
import { hasIdentity, mapDownloadUrls, secondaryList } from "./utils";

export const playlistRouter = router({
  details: publicProcedure
    .input(playlistInput)
    .output(z.custom<Playlist>())
    .query(async ({ input, ctx: { catalogApi: api } }) => {
      const { id, token, lang } = input;
      if (!id && !token) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Please provide playlist id or a token",
        });
      }
      const isNumeric = (val?: string) => Boolean(val && /^\d+$/.test(val));
      const listid = id || (isNumeric(token) ? token : undefined);
      const endpoint = listid ? endpoints.playlist.id : endpoints.playlist.link;
      const result = await api(endpoint, {
        query: {
          listid,
          token: listid ? (token ?? "") : token,
          type: "playlist",
          p: "1",
          n: "50",
        },
        language: lang,
      });
      if (!hasIdentity(result, "id")) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No playlist found, please check the id or token",
        });
      }
      mapDownloadUrls(result, "list");
      return result as Playlist;
    }),

  recommendations: publicProcedure
    .input(playlistRecommendInput)
    .output(z.custom<RelatedPlaylist[]>())
    .query(async ({ input, ctx: { catalogApi: api } }) => {
      const result = await secondaryList(() =>
        api<RelatedPlaylist[]>(endpoints.playlist.recommend, {
          query: {
            listid: input.id,
            language: input.lang,
          },
        }),
      );
      // Secondary list: no recommendations is not a missing playlist.
      return Array.isArray(result) ? result : [];
    }),
});
