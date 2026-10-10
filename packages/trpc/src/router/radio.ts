import type { Radio, Song, StationDetailsResponse } from "@infinitunes/types";
import { parseToken } from "@infinitunes/types";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { endpoints } from "../lib/endpoints";
import {
  createStationInput,
  radioSongsInput,
  stationDetailsInput,
} from "../lib/inputs";
import { publicProcedure, router } from "../trpc";
import { isRecord, withDownloadUrl } from "./utils";

function extractSongsFromRadioResponse(data: unknown): Song[] {
  if (!isRecord(data)) return [];
  const songs: Song[] = [];

  // Upstream returns object keyed by numeric indices ("0", "1", "2", ...)
  const keys = Object.keys(data).filter((k) => /^\d+$/.test(k));
  keys.sort((a, b) => Number(a) - Number(b));

  for (const key of keys) {
    const entry = data[key];
    if (isRecord(entry) && isRecord(entry.song)) {
      songs.push(withDownloadUrl(entry.song) as Song);
    }
  }

  return songs;
}

export const radioRouter = router({
  createStation: publicProcedure
    .input(createStationInput)
    .output(z.object({ stationId: z.string() }))
    .mutation(async ({ input, ctx: { catalogApi: api } }) => {
      let stationId = "";

      if (input.type === "artist" && input.artistId) {
        const res = await api<{ stationid?: string }>(
          endpoints.radio.create_artist_station,
          {
            query: {
              artistid: input.artistId,
              name: input.name,
              query: input.query || input.name,
              language: input.language,
              mode: input.mode ?? "",
            },
            // Mints a per-listener session: never replay it from cache.
            cache: false,
          },
        );
        if (isRecord(res) && typeof res.stationid === "string") {
          stationId = res.stationid;
        }
      }

      if (!stationId) {
        const res = await api<{ stationid?: string }>(
          endpoints.radio.create_featured_station,
          {
            query: {
              name: input.name,
              language: input.language,
              query: input.query,
            },
            cache: false,
          },
        );
        if (isRecord(res) && typeof res.stationid === "string") {
          stationId = res.stationid;
        }
      }

      if (!stationId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Failed to create radio station session",
        });
      }

      return { stationId };
    }),

  songs: publicProcedure
    .input(radioSongsInput)
    .output(z.custom<Song[]>())
    .query(async ({ input, ctx: { catalogApi: api } }) => {
      const result = await api(endpoints.radio.get_song, {
        query: {
          stationid: input.stationId,
          k: input.k,
          next: input.next,
          language: input.lang,
        },
        cache: false,
      });

      return extractSongsFromRadioResponse(result);
    }),

  stationDetails: publicProcedure
    .input(stationDetailsInput)
    .output(z.custom<StationDetailsResponse>())
    .query(async ({ input, ctx: { catalogApi: api } }) => {
      const page1 = await api<Radio[]>(endpoints.get.featured_stations, {
        query: { p: 1, n: 50, languages: input.lang },
      });

      const stations = Array.isArray(page1) ? [...page1] : [];
      const cleanToken = input.token.trim();
      const tokenNameMatch = (input.name || cleanToken)
        .replace(/-/g, " ")
        .toLowerCase();

      const matches = (s: Radio) =>
        s.perma_url.endsWith(cleanToken) ||
        parseToken(s.perma_url) === cleanToken ||
        s.id === cleanToken ||
        s.title.toLowerCase() === tokenNameMatch;

      let matchedStation = stations.find(matches);

      // If not in first page and more stations exist, try second page
      if (!matchedStation && stations.length >= 50) {
        const page2 = await api<Radio[]>(endpoints.get.featured_stations, {
          query: { p: 2, n: 50, languages: input.lang },
        });
        if (Array.isArray(page2)) {
          matchedStation = page2.find(matches);
        }
      }

      const displayName =
        matchedStation?.title ?? (input.name || cleanToken).replace(/-/g, " ");
      const stationLang =
        matchedStation?.more_info?.language || input.lang || "hindi";

      const station: Radio = matchedStation ?? {
        id: cleanToken,
        title: displayName,
        subtitle: `${stationLang.charAt(0).toUpperCase() + stationLang.slice(1)} Radio`,
        type: "radio_station",
        image:
          "https://staticfe.saavn.com/web6/jioindw/dist/1696482270/_i/default_images/default-radio-500x500.jpg",
        perma_url: `https://www.saavn.com/s/radio/${input.name || cleanToken}/${cleanToken}`,
        explicit_content: "0",
        more_info: {
          featured_station_type: "featured",
          language: stationLang,
          station_display_text: displayName,
          query: "",
        },
      };

      const createRes = await api<{ stationid?: string }>(
        endpoints.radio.create_featured_station,
        {
          query: {
            name: station.title,
            language: stationLang,
          },
          // Mints a per-listener session: never replay it from cache.
          cache: false,
        },
      );

      const stationId =
        isRecord(createRes) && typeof createRes.stationid === "string"
          ? createRes.stationid
          : "";

      let songs: Song[] = [];
      if (stationId) {
        const songsRes = await api(endpoints.radio.get_song, {
          query: {
            stationid: stationId,
            k: 20,
            language: stationLang,
          },
          cache: false,
        });
        songs = extractSongsFromRadioResponse(songsRes);
      }

      return {
        station,
        stationId,
        songs,
      };
    }),
});
