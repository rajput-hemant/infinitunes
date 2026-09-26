import type { EpisodeDetail, Show } from "@infinitunes/types";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { api } from "../lib/api";
import { endpoints } from "../lib/endpoints";
import { showEpisodesInput, showInput } from "../lib/inputs";
import { publicProcedure, router } from "../trpc";
import {
  isRecord,
  mapDownloadUrls,
  tokenFromLink,
  withDownloadUrl,
} from "./utils";

function requireShowToken(
  input: { token?: string; link?: string },
  noun: "show" | "episode",
): string {
  const { token, link } = input;
  if (!link && !token) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Please provide ${noun} token or link`,
    });
  }
  if (link && !link.includes("shows")) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Please provide valid ${noun} link`,
    });
  }
  return token || tokenFromLink(link ?? "");
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
        return result.map((item) => withDownloadUrl(item));
      }
      if (isRecord(result)) mapDownloadUrls(result, "episodes");
      return result;
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
