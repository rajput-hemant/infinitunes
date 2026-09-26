import type {
  Chart,
  FeaturedPlaylists,
  FooterDetails,
  Label,
  Lyrics,
  MegaMenu,
  Mix,
  Radio,
  Song,
  TopAlbum,
  TopArtists,
  TopShows,
  Trending,
} from "@infinitunes/types";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { api } from "../lib/api";
import { endpoints } from "../lib/endpoints";
import {
  getActorTopSongsInput,
  getFooterInput,
  getLabelInput,
  getLyricsInput,
  getMegaMenuInput,
  getMixInput,
  getPagedInput,
  getTrendingInput,
} from "../lib/inputs";
import { publicProcedure, router } from "../trpc";
import {
  hasIdentity,
  isRecord,
  mapDownloadUrls,
  tokenFromLink,
  withDownloadUrl,
} from "./utils";

function pagedQuery(input: { page?: number; n?: number; lang?: string }) {
  return {
    p: input.page ?? "1",
    n: input.n ?? "20",
    languages: input.lang,
  };
}

export const getRouter = router({
  trending: publicProcedure
    .input(getTrendingInput)
    .output(z.custom<Trending>())
    .query(async ({ input }) => {
      const lang = input.lang?.split(",")[0];
      const query: Record<string, string> = {};
      if (lang) query.entity_language = lang;
      if (input.type) query.entity_type = input.type;

      let result = await api(endpoints.get.trending, { query });
      if (!Array.isArray(result) || result.length === 0) {
        if (input.type) {
          const fallback = await api(endpoints.get.trending, {
            query: lang ? { entity_language: lang } : {},
          });
          result = Array.isArray(fallback)
            ? fallback.filter(
                (item) => isRecord(item) && item.type === input.type,
              )
            : [];
        }
      }
      // Trending is a secondary carousel on entity pages; an empty upstream
      // answer must not fail the page that fetches it alongside its entity.
      if (!Array.isArray(result)) return [];
      // trending mixes songs, albums and playlists; withDownloadUrl no-ops on
      // entities without an encrypted_media_url
      return result.map((item) => withDownloadUrl(item)) as Trending;
    }),

  featuredPlaylists: publicProcedure
    .input(getPagedInput)
    .output(z.custom<FeaturedPlaylists>())
    .query(async ({ input }) => {
      return api<FeaturedPlaylists>(endpoints.get.featured_playlists, {
        query: pagedQuery(input),
      });
    }),

  charts: publicProcedure
    .input(getPagedInput)
    .output(z.custom<Chart[]>())
    .query(async ({ input }) => {
      return api<Chart[]>(endpoints.get.charts, {
        query: pagedQuery(input),
      });
    }),

  topShows: publicProcedure
    .input(getPagedInput)
    .output(z.custom<TopShows>())
    .query(async ({ input }) => {
      return api<TopShows>(endpoints.get.top_shows, {
        query: pagedQuery(input),
      });
    }),

  topArtists: publicProcedure
    .input(getPagedInput)
    .output(z.custom<TopArtists>())
    .query(async ({ input }) => {
      return api<TopArtists>(endpoints.get.top_artists, {
        query: pagedQuery(input),
      });
    }),

  topAlbums: publicProcedure
    .input(getPagedInput)
    .output(z.custom<TopAlbum>())
    .query(async ({ input }) => {
      return api<TopAlbum>(endpoints.get.top_albums, {
        query: pagedQuery(input),
      });
    }),

  featuredStations: publicProcedure
    .input(getPagedInput)
    .output(z.custom<Radio[]>())
    .query(async ({ input }) => {
      return api<Radio[]>(endpoints.get.featured_stations, {
        query: pagedQuery(input),
      });
    }),

  actorTopSongs: publicProcedure
    .input(getActorTopSongsInput)
    .output(z.custom<Song[]>())
    .query(async ({ input }) => {
      const result = await api(endpoints.get.actor_top_songs, {
        query: {
          actor_ids: input.actor_id,
          song_id: input.song_id,
          language: input.lang,
        },
      });
      // Secondary "songs from the same actors" list on the song page.
      if (!Array.isArray(result)) return [];
      return result.map((item) => withDownloadUrl(item)) as Song[];
    }),

  lyrics: publicProcedure
    .input(getLyricsInput)
    .output(z.custom<Lyrics>())
    .query(async ({ input }) => {
      const result = await api<Lyrics>(endpoints.get.lyrics, {
        query: { lyrics_id: input.id },
      });
      if (!hasIdentity(result, "lyrics")) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid ID or Lyrics not available for the song",
        });
      }
      return result as Lyrics;
    }),

  footer: publicProcedure
    .input(getFooterInput)
    .output(z.custom<FooterDetails>())
    .query(async ({ input }) => {
      return api<FooterDetails>(endpoints.get.footer_details, {
        query: {
          language: input.lang?.split(",")[0] ?? "hindi",
          p: input.page,
          n: input.n,
        },
      });
    }),

  mix: publicProcedure
    .input(getMixInput)
    .output(z.custom<Mix>())
    .query(async ({ input }) => {
      const { token, link, lang } = input;
      if (!link && !token) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Please provide a valid token or link",
        });
      }
      if (link && !link.includes("mix")) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Please provide a valid link",
        });
      }
      const result = await api(endpoints.get.mix_details, {
        query: {
          token: token || tokenFromLink(link ?? ""),
          type: "mix",
          p: input.page,
          n: input.n,
          language: lang,
        },
      });
      // Upstream answers a non-mix token with a bare `null`.
      if (!hasIdentity(result, "id")) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            "Failed to fetch mix details, please provide a valid token or link",
        });
      }
      mapDownloadUrls(result, "list");
      return result as Mix;
    }),

  label: publicProcedure
    .input(getLabelInput)
    .output(z.custom<Label>())
    .query(async ({ input }) => {
      const { token, link, lang } = input;
      if (!link && !token) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Please provide a token or a link",
        });
      }
      if (link && !link.includes("label")) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Please provide a valid link",
        });
      }
      const result = await api(endpoints.get.label_details, {
        query: {
          token: token || tokenFromLink(link ?? ""),
          type: "label",
          p: input.page,
          n_song: input.n_song,
          n_album: input.n_album,
          category: input.cat,
          sort_order: input.sort,
          language: lang,
        },
      });
      if (!hasIdentity(result, "labelId")) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            "Failed to fetch label details, please provide a valid token or link",
        });
      }
      if (isRecord(result.topSongs)) mapDownloadUrls(result.topSongs, "songs");
      return result as Label;
    }),

  megaMenu: publicProcedure
    .input(getMegaMenuInput)
    .output(z.custom<MegaMenu>())
    .query(async ({ input }) => {
      return api<MegaMenu>(endpoints.get.mega_menu, {
        query: {
          is_entity_page: `${input.entity ?? false}`,
          language: input.lang,
        },
      });
    }),
});
