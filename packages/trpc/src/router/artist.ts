import type { Artist, Song } from "@infinitunes/types";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { api } from "../lib/api";
import { endpoints } from "../lib/endpoints";
import {
  artistInput,
  artistSongsAlbumsInput,
  artistTopSongsInput,
} from "../lib/inputs";
import { publicProcedure, router } from "../trpc";
import {
  hasIdentity,
  isRecord,
  mapDownloadUrls,
  tokenFromLink,
  withDownloadUrl,
} from "./utils";

export const artistRouter = router({
  details: publicProcedure
    .input(artistInput)
    .output(z.custom<Artist>())
    .query(async ({ input }) => {
      const { id, token, link, lang } = input;
      if (!id && !link && !token) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Please provide Artist id, link or token",
        });
      }
      if (id && link) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Please provide either Artist id or link",
        });
      }
      if (link && !link.includes("artist")) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Please provide a valid JioSaavn link",
        });
      }
      const t = token || tokenFromLink(link ?? "");
      const endpoint = id ? endpoints.artist.id : endpoints.artist.link;
      const result = await api(endpoint, {
        query: {
          artistId: id,
          token: t,
          type: id ? "" : "artist",
          p: input.page,
          n_song: input.n_song,
          n_album: input.n_album,
        },
        language: lang,
      });
      if (!hasIdentity(result, "artistId")) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Artist not found, please check the id or link",
        });
      }
      mapDownloadUrls(result, "topSongs");
      return result as Artist;
    }),

  songs: publicProcedure
    .input(artistSongsAlbumsInput)
    .query(async ({ input }) => {
      const result = await api(endpoints.artist.songs, {
        query: {
          artistId: input.id,
          page: input.page,
          category: input.cat,
          sort_order: input.sort,
          n_song: "50",
        },
        language: input.lang,
      });
      if (isRecord(result)) mapDownloadUrls(result.topSongs, "songs");
      return result;
    }),

  albums: publicProcedure
    .input(artistSongsAlbumsInput)
    .query(async ({ input }) => {
      const result = await api(endpoints.artist.albums, {
        query: {
          artistId: input.id,
          page: input.page,
          category: input.cat,
          sort_order: input.sort,
          n_song: "50",
        },
        language: input.lang,
      });
      return result;
    }),

  topSongs: publicProcedure
    .input(artistTopSongsInput)
    .output(z.custom<Song[]>())
    .query(async ({ input }) => {
      const result = await api(endpoints.artist.top_songs, {
        query: {
          artist_ids: input.artist_id,
          song_id: input.song_id,
          page: input.page,
          category: input.cat,
          sort_order: input.sort,
          language: input.lang,
        },
      });
      // Secondary "more from these artists" list on the song page.
      if (!Array.isArray(result)) return [];
      return result.map((item) => withDownloadUrl(item)) as Song[];
    }),
});
