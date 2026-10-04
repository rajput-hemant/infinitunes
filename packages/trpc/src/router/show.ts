import type { Episode, EpisodeDetail, Show } from "@infinitunes/types";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { api } from "../lib/api";
import { endpoints } from "../lib/endpoints";
import { showEpisodesInput, showInput } from "../lib/inputs";
import { publicProcedure, router } from "../trpc";
import { mapDownloadUrls, withDownloadUrl } from "./utils";

function requireShowToken(
  input: { token?: string },
  noun: "show" | "episode",
): string {
  const { token } = input;
  if (!token) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Please provide ${noun} token`,
    });
  }
  return token;
}

export const showRouter = router({
  details: publicProcedure
    .input(showInput)
    .output(z.custom<Show>())
    .query(async ({ input }) => {
      const result = await api(endpoints.show.show_details, {
        query: {
          token: requireShowToken(input, "show"),
          type: "show",
          season_number: input.season,
          sort_order: input.sort,
        },
      });
      mapDownloadUrls(result, "episodes");
      return result as Show;
    }),

  episodes: publicProcedure
    .input(showEpisodesInput)
    .output(z.custom<Episode[]>())
    .query(async ({ input }) => {
      const result = await api(endpoints.show.episodes, {
        query: {
          show_id: input.id,
          season_number: input.season,
          p: input.page,
          sort_order: input.sort,
        },
      });
      // Upstream answers with an object instead of a list when the show has no
      // episodes for that page.
      if (!Array.isArray(result)) return [];
      return result.map((item) => withDownloadUrl(item)) as Episode[];
    }),

  episodeDetails: publicProcedure
    .input(showInput)
    .output(z.custom<EpisodeDetail>())
    .query(async ({ input }) => {
      const result = await api(endpoints.show.episode_details, {
        query: {
          token: requireShowToken(input, "episode"),
          type: "episode",
          season_number: input.season,
          sort_order: input.sort,
        },
      });
      mapDownloadUrls(result, "episodes");
      return result as EpisodeDetail;
    }),
});
