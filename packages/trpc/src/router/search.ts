import type {
  AllSearch,
  SearchReturnType,
  TopSearch,
} from "@infinitunes/types";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { api } from "../lib/api";
import { endpoints } from "../lib/endpoints";
import {
  searchAllInput,
  searchByTypeInput,
  searchTopInput,
} from "../lib/inputs";
import { publicProcedure, router } from "../trpc";
import { withDownloadUrl } from "./utils";

export const searchRouter = router({
  top: publicProcedure
    .input(searchTopInput)
    .output(z.custom<TopSearch[]>())
    .query(async () => {
      const result = await api<TopSearch[]>(endpoints.search.top_search, {});
      // Secondary discovery list on the search page.
      return Array.isArray(result) ? result : [];
    }),

  all: publicProcedure
    .input(searchAllInput)
    .output(z.custom<AllSearch>())
    .query(async ({ input }) => {
      const result = await api<AllSearch>(endpoints.search.all, {
        query: { query: input.q },
        isVersion4: false,
      });
      if (!(result as unknown as Record<string, unknown>).albums) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No search results found",
        });
      }
      return result;
    }),

  byType: publicProcedure
    .input(searchByTypeInput)
    .output(z.custom<SearchReturnType>())
    .query(async ({ input }) => {
      if (input.type === "podcasts") {
        const result = await api<SearchReturnType>(endpoints.search.more, {
          query: {
            query: input.q,
            p: input.page,
            n: input.n,
            params: JSON.stringify({ type: "podcasts" }),
          },
        });
        const payload = result as unknown as {
          results?: Record<string, unknown>[];
        };
        if (!payload.results) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No search results found",
          });
        }
        payload.results = payload.results.map(withDownloadUrl);
        return result;
      }
      const map = {
        songs: endpoints.search.songs,
        albums: endpoints.search.albums,
        playlists: endpoints.search.playlists,
        artists: endpoints.search.artists,
      } as const;
      const result = await api<SearchReturnType>(map[input.type], {
        query: { q: input.q, p: input.page, n: input.n },
      });
      const payload = result as unknown as {
        results?: Record<string, unknown>[];
      };
      if (!payload.results) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No search results found",
        });
      }
      if (input.type === "songs") {
        payload.results = payload.results.map(withDownloadUrl);
      }
      return result;
    }),
});
