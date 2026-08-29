import { TRPCError } from "@trpc/server";

import { api } from "../lib/api";
import { endpoints } from "../lib/endpoints";
import { showEpisodesInput, showInput } from "../lib/inputs";
import { publicProcedure, router } from "../trpc";
import { tokenFromLink, withDownloadUrl } from "./utils";

export const showRouter = router({
  details: publicProcedure.input(showInput).query(async ({ input }) => {
    const { token, link, season, sort } = input;
    if (!link && !token) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Please provide show token or link",
      });
    }
    if (link && !link.includes("shows")) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Please provide valid show link",
      });
    }
    const result = await api(endpoints.show.show_details, {
      query: {
        token: token || tokenFromLink(link ?? ""),
        type: "show",
        season_number: season,
        sort_order: sort,
      },
    });
    const payload = result as { episodes?: Record<string, unknown>[] };
    if (Array.isArray(payload.episodes)) {
      payload.episodes = payload.episodes.map(withDownloadUrl);
    }
    return result;
  }),

  episodes: publicProcedure
    .input(showEpisodesInput)
    .query(async ({ input }) => {
      const result = await api(endpoints.show.episodes, {
        query: {
          show_id: input.id,
          season_number: input.season,
          p: input.page,
          sort_order: input.sort,
        },
      });
      if (Array.isArray(result)) {
        return result.map(withDownloadUrl);
      }
      const payload = result as { episodes?: Record<string, unknown>[] };
      if (Array.isArray(payload.episodes)) {
        payload.episodes = payload.episodes.map(withDownloadUrl);
      }
      return result;
    }),

  episodeDetails: publicProcedure.input(showInput).query(async ({ input }) => {
    const { token, link, season, sort } = input;
    if (!link && !token) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Please provide episode token or link",
      });
    }
    if (link && !link.includes("shows")) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Please provide valid episode link",
      });
    }
    const result = await api(endpoints.show.episode_details, {
      query: {
        token: token || tokenFromLink(link ?? ""),
        type: "episode",
        season_number: season,
        sort_order: sort,
      },
    });
    const payload = result as { episodes?: Record<string, unknown>[] };
    if (Array.isArray(payload.episodes)) {
      payload.episodes = payload.episodes.map(withDownloadUrl);
    }
    return result;
  }),
});
