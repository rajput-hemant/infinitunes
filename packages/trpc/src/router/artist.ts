import type { Artist, Song } from "@infinitunes/types";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

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
  secondaryList,
  withDownloadUrl,
} from "./utils";

/** Paged artist songs/albums share one upstream shape; `finalize` post-processes the raw result. */
function artistList(call: string, finalize?: (result: unknown) => void) {
  return publicProcedure
    .input(artistSongsAlbumsInput)
    .query(async ({ input, ctx: { catalogApi: api } }) => {
      const result = await api(call, {
        query: {
          artistId: input.id,
          page: input.page,
          category: input.cat,
          sort_order: input.sort,
          n_song: "50",
        },
        language: input.lang,
      });
      finalize?.(result);
      return result;
    });
}

export const artistRouter = router({
  details: publicProcedure
    .input(artistInput)
    .output(z.custom<Artist>())
    .query(async ({ input, ctx: { catalogApi: api } }) => {
      const { id, token, lang } = input;
      if (!id && !token) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Please provide Artist id or token",
        });
      }
      const endpoint = id ? endpoints.artist.id : endpoints.artist.link;
      const result = await api(endpoint, {
        query: {
          artistId: id,
          token,
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
          message: "Artist not found, please check the id or token",
        });
      }
      mapDownloadUrls(result, "topSongs");
      return result as Artist;
    }),

  songs: artistList(endpoints.artist.songs, (result) => {
    if (isRecord(result)) mapDownloadUrls(result.topSongs, "songs");
  }),

  albums: artistList(endpoints.artist.albums),

  topSongs: publicProcedure
    .input(artistTopSongsInput)
    .output(z.custom<Song[]>())
    .query(async ({ input, ctx: { catalogApi: api } }) => {
      const result = await secondaryList(() =>
        api(endpoints.artist.top_songs, {
          query: {
            artist_ids: input.artist_id,
            song_id: input.song_id,
            page: input.page,
            category: input.cat,
            sort_order: input.sort,
            language: input.lang,
          },
        }),
      );
      // Secondary "more from these artists" list on the song page.
      if (!Array.isArray(result)) return [];
      return result.map((item) => withDownloadUrl(item)) as Song[];
    }),
});
