import { TRPCError } from "@trpc/server";

import { api } from "../lib/api";
import { createDownloadLinks } from "../lib/download";
import { endpoints } from "../lib/endpoints";
import {
  albumInput,
  albumRecommendInput,
  albumSameYearInput,
  artistInput,
  artistSongsAlbumsInput,
  artistTopSongsInput,
  getActorTopSongsInput,
  getFooterInput,
  getLyricsInput,
  getMegaMenuInput,
  getMixInput,
  getPagedInput,
  getLabelInput,
  getTrendingInput,
  homeInput,
  playlistInput,
  playlistRecommendInput,
  searchAllInput,
  searchByTypeInput,
  searchTopInput,
  showEpisodesInput,
  showInput,
  songInput,
  songRecommendInput,
} from "../lib/inputs";
import { publicProcedure, router } from "../trpc";

function tokenFromLink(link: string) {
  return link.split("/").at(-1) ?? "";
}

function resolveNumericId(t: string, type: "album" | "playlist") {
  if (/^\d+$/.test(t)) return Promise.resolve(t);
  const result = api(endpoints[type].link, {
    query: { token: t, type },
  }) as Promise<{ id?: string }>;
  return result.then((r) => r.id ?? t);
}

function withDownloadUrl(item: unknown) {
  const obj = item as Record<string, unknown>;
  const more = obj.more_info as Record<string, unknown> | undefined;
  if (more && typeof more.encrypted_media_url === "string") {
    const url = createDownloadLinks(more.encrypted_media_url);
    if (url) {
      obj.download_url = url;
      more.download_url = url;
    }
  }
  return obj;
}

export const homeRouter = router({
  home: publicProcedure.input(homeInput).query(async ({ input }) => {
    return api(endpoints.modules.launch_data, {
      language: input.lang,
    });
  }),
});

export const songRouter = router({
  details: publicProcedure.input(songInput).query(async ({ input }) => {
    const { id, token, link, lang } = input;
    if (!id && !link && !token) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Please provide song id(s), link or a token",
      });
    }
    if (link && !link.includes("song")) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Please provide a valid JioSaavn link",
      });
    }
    const result = await api(endpoints.song.id, {
      query: {
        pids: id,
        token: token || tokenFromLink(link ?? ""),
        type: "song",
      },
      language: lang,
    });
    if (!("songs" in (result as Record<string, unknown>))) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Song not found, please check the id, link or token",
      });
    }
    const payload = result as { songs: Record<string, unknown>[] };
    payload.songs = payload.songs.map(withDownloadUrl);
    return result;
  }),

  recommendations: publicProcedure
    .input(songRecommendInput)
    .query(async ({ input }) => {
      const result = await api(endpoints.song.recommend, {
        query: {
          pid: input.id,
          language: input.lang,
        },
      });
      if (!Array.isArray(result) || result.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No recommendations found, please check the id",
        });
      }
      return result;
    }),
});

export const albumRouter = router({
  details: publicProcedure.input(albumInput).query(async ({ input }) => {
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
    if (!(result as Record<string, unknown>).id) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No album found, please check the id, link or token",
      });
    }
    return result;
  }),

  recommendations: publicProcedure
    .input(albumRecommendInput)
    .query(async ({ input }) => {
      const result = await api(endpoints.album.recommend, {
        query: {
          albumid: input.id,
          language: input.lang,
        },
      });
      return result;
    }),

  sameYear: publicProcedure
    .input(albumSameYearInput)
    .query(async ({ input }) => {
      const result = await api(endpoints.album.same_year, {
        query: {
          album_year: input.year,
          album_lang: input.lang,
        },
      });
      if (!Array.isArray(result) || result.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No albums found, please check the year",
        });
      }
      return result;
    }),
});

export const playlistRouter = router({
  details: publicProcedure.input(playlistInput).query(async ({ input }) => {
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
    const result = await api(endpoints.playlist.id, {
      query: {
        listid,
        token: t,
        type: "playlist",
        p: "1",
        n: "50",
      },
      language: lang,
    });
    if (!(result as Record<string, unknown>).id) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No playlist found, please check the id, link or token",
      });
    }
    return result;
  }),

  recommendations: publicProcedure
    .input(playlistRecommendInput)
    .query(async ({ input }) => {
      const result = await api(endpoints.playlist.recommend, {
        query: {
          listid: input.id,
          language: input.lang,
        },
      });
      if (!Array.isArray(result) || result.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No recommendations found, please check the id",
        });
      }
      return result;
    }),
});

export const artistRouter = router({
  details: publicProcedure.input(artistInput).query(async ({ input }) => {
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
    const result = await api(endpoints.artist.id, {
      query: {
        artistId: id,
        token: token || tokenFromLink(link ?? ""),
        type: id ? "" : "artist",
        p: input.page,
        n_song: input.n_song,
        n_album: input.n_album,
      },
      language: lang,
    });
    if (!(result as Record<string, unknown>).artistId) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Artist not found, please check the id or link",
      });
    }
    return result;
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
      if (!Array.isArray(result) || result.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Artist not found, please check the ids",
        });
      }
      return result;
    }),
});

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

export const searchRouter = router({
  top: publicProcedure.input(searchTopInput).query(async () => {
    const result = await api(endpoints.search.top_search, {});
    if (!Array.isArray(result) || result.length === 0) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No top searches found",
      });
    }
    return result;
  }),

  all: publicProcedure.input(searchAllInput).query(async ({ input }) => {
    const result = await api(endpoints.search.all, {
      query: { query: input.q },
      isVersion4: false,
    });
    if (!(result as Record<string, unknown>).albums) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No search results found",
      });
    }
    return result;
  }),

  byType: publicProcedure.input(searchByTypeInput).query(async ({ input }) => {
    if (input.type === "podcasts") {
      const result = await api(endpoints.search.more, {
        query: {
          query: input.q,
          p: input.page,
          n: input.n,
          params: JSON.stringify({ type: "podcasts" }),
        },
      });
      if (!(result as Record<string, unknown>).results) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No search results found",
        });
      }
      return result;
    }
    const map = {
      songs: endpoints.search.songs,
      albums: endpoints.search.albums,
      playlists: endpoints.search.playlists,
      artists: endpoints.search.artists,
    } as const;
    const result = await api(map[input.type], {
      query: { q: input.q, p: input.page, n: input.n },
    });
    if (!(result as Record<string, unknown>).results) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No search results found",
      });
    }
    return result;
  }),
});

export const getRouter = router({
  trending: publicProcedure.input(getTrendingInput).query(async ({ input }) => {
    const lang = input.lang?.split(",")[0];
    const query: Record<string, string> = {};
    if (lang) query.entity_language = lang;
    if (input.type) query.entity_type = input.type;

    let result = await api(endpoints.get.trending, { query });
    if (!Array.isArray(result) || result.length === 0) {
      if (input.type) {
        result = await api(endpoints.get.trending, {
          query: lang ? { entity_language: lang } : {},
        });
        result = (result as unknown[]).filter(
          (t) => (t as { type?: string }).type === input.type,
        );
      }
      if (!Array.isArray(result) || result.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Failed to fetch trending items",
        });
      }
    }
    return result;
  }),

  featuredPlaylists: publicProcedure
    .input(getPagedInput)
    .query(async ({ input }) => {
      return api(endpoints.get.featured_playlists, {
        query: {
          p: input.page ?? "1",
          n: input.n ?? "20",
          languages: input.lang,
        },
      });
    }),

  charts: publicProcedure.input(getPagedInput).query(async ({ input }) => {
    return api(endpoints.get.charts, {
      query: {
        p: input.page ?? "1",
        n: input.n ?? "20",
        languages: input.lang,
      },
    });
  }),

  topShows: publicProcedure.input(getPagedInput).query(async ({ input }) => {
    return api(endpoints.get.top_shows, {
      query: {
        p: input.page ?? "1",
        n: input.n ?? "20",
        languages: input.lang,
      },
    });
  }),

  topArtists: publicProcedure.input(getPagedInput).query(async ({ input }) => {
    return api(endpoints.get.top_artists, {
      query: {
        p: input.page ?? "1",
        n: input.n ?? "20",
        languages: input.lang,
      },
    });
  }),

  topAlbums: publicProcedure.input(getPagedInput).query(async ({ input }) => {
    return api(endpoints.get.top_albums, {
      query: {
        p: input.page ?? "1",
        n: input.n ?? "20",
        languages: input.lang,
      },
    });
  }),

  featuredStations: publicProcedure
    .input(getPagedInput)
    .query(async ({ input }) => {
      return api(endpoints.get.featured_stations, {
        query: {
          p: input.page ?? "1",
          n: input.n ?? "20",
          languages: input.lang,
        },
      });
    }),

  actorTopSongs: publicProcedure
    .input(getActorTopSongsInput)
    .query(async ({ input }) => {
      const result = await api(endpoints.get.actor_top_songs, {
        query: {
          actor_ids: input.actor_id,
          song_id: input.song_id,
          language: input.lang,
        },
      });
      if (!Array.isArray(result) || result.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            "Failed to fetch actor top songs, please provide a valid ID(s)",
        });
      }
      return result;
    }),

  lyrics: publicProcedure.input(getLyricsInput).query(async ({ input }) => {
    const result = await api(endpoints.get.lyrics, {
      query: { lyrics_id: input.id },
    });
    if (!(result as Record<string, unknown>).lyrics) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Invalid ID or Lyrics not available for the song",
      });
    }
    return result;
  }),

  footer: publicProcedure.input(getFooterInput).query(async ({ input }) => {
    return api(endpoints.get.footer_details, {
      query: {
        language: input.lang?.split(",")[0] ?? "hindi",
        p: input.page,
        n: input.n,
      },
    });
  }),

  mix: publicProcedure.input(getMixInput).query(async ({ input }) => {
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
    if (!(result as Record<string, unknown>).id) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message:
          "Failed to fetch mix details, please provide a valid token or link",
      });
    }
    return result;
  }),

  label: publicProcedure.input(getLabelInput).query(async ({ input }) => {
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
    if (!(result as Record<string, unknown>).labelId) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message:
          "Failed to fetch label details, please provide a valid token or link",
      });
    }
    return result;
  }),

  megaMenu: publicProcedure.input(getMegaMenuInput).query(async ({ input }) => {
    return api(endpoints.get.mega_menu, {
      query: {
        is_entity_page: `${input.entity ?? false}`,
        language: input.lang,
      },
    });
  }),
});
