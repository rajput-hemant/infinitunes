import { parseLrc } from "@infinitunes/core/lyrics";
import type { LyricLine } from "@infinitunes/core/lyrics";
import { decode, plainText } from "@infinitunes/types";
import { z } from "zod";

import type { api } from "./api";
import { endpoints } from "./endpoints";

export type SyncedLyrics = {
  synced: LyricLine[] | null;
  plain: string | null;
  instrumental: boolean;
  source: "lrclib" | "jiosaavn";
  copyright: string | null;
};

const candidate = z.object({
  duration: z.number().finite().optional(),
  syncedLyrics: z.string().nullish(),
  plainLyrics: z.string().nullish(),
  instrumental: z.boolean().optional(),
});
const songShape = z.object({
  songs: z.array(
    z.object({
      title: z.string(),
      subtitle: z.string().optional(),
      more_info: z.object({
        album: z.string().optional(),
        duration: z.union([z.string(), z.number()]).optional(),
        artistMap: z
          .object({
            primary_artists: z.array(z.object({ name: z.string() })).optional(),
          })
          .optional(),
      }),
    }),
  ),
});
const plainShape = z.object({
  lyrics: z.string(),
  lyrics_copyright: z.string().optional(),
});
const USER_AGENT = "Infinitunes (https://github.com/rajput-hemant/infinitunes)";
const empty: SyncedLyrics = {
  synced: null,
  plain: null,
  instrumental: false,
  source: "jiosaavn",
  copyright: null,
};

type Match = z.infer<typeof candidate>;
type Query = { title: string; artist: string; album: string; duration: number };

function usable(match: Match) {
  return (
    match.instrumental ||
    Boolean(match.plainLyrics?.trim()) ||
    parseLrc(match.syncedLyrics ?? "").some((line) => line.text)
  );
}

const PER_REQUEST_TIMEOUT_MS = 5000;
export const DEFAULT_LYRICS_TIMEOUT_MS = 8000;

async function request(
  path: "get" | "search",
  query: Query,
  signal?: AbortSignal,
): Promise<unknown> {
  const url = new URL(`https://lrclib.net/api/${path}`);
  url.searchParams.set("track_name", query.title);
  url.searchParams.set("artist_name", query.artist);
  if (path === "get") {
    if (query.album) url.searchParams.set("album_name", query.album);
    if (query.duration > 0)
      url.searchParams.set("duration", String(query.duration));
  }
  try {
    const timeoutSignal = AbortSignal.timeout(PER_REQUEST_TIMEOUT_MS);
    const combinedSignal = signal
      ? AbortSignal.any([signal, timeoutSignal])
      : timeoutSignal;
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: combinedSignal,
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

async function lookup(
  query: Query,
  signal?: AbortSignal,
): Promise<Match | null> {
  if (signal?.aborted) return null;
  const direct = candidate.safeParse(await request("get", query, signal));
  if (direct.success && usable(direct.data)) return direct.data;
  if (signal?.aborted) return null;
  const results = await request("search", query, signal);
  if (!Array.isArray(results) || query.duration <= 0) return null;
  const matches = results.flatMap((item: unknown) => {
    const parsed = candidate.safeParse(item);
    return parsed.success &&
      parsed.data.duration !== undefined &&
      Math.abs(parsed.data.duration - query.duration) <= 3 &&
      usable(parsed.data)
      ? [parsed.data]
      : [];
  });
  matches.sort((a, b) => {
    const synced = (m: Match) =>
      Number(parseLrc(m.syncedLyrics ?? "").some((line) => line.text));
    return (
      synced(b) - synced(a) ||
      Math.abs((a.duration ?? 0) - query.duration) -
        Math.abs((b.duration ?? 0) - query.duration)
    );
  });
  return matches[0] ?? null;
}

function cleanTitle(title: string) {
  return title
    .replace(/\s*\(From\s+["“].*?["”]\)\s*/gi, " ")
    .replace(/\s*[([]?\b(?:feat\.?|ft\.?)\s+.*$/i, "")
    .trim();
}

export async function getSyncedLyrics(
  id: string,
  catalogApi: typeof api,
  timeoutMs: number = DEFAULT_LYRICS_TIMEOUT_MS,
  callerSignal?: AbortSignal,
): Promise<SyncedLyrics> {
  // shortcut: LRCLIB bypasses the Next catalog cache; add an injected cache if lookup traffic warrants it.
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  const signal = callerSignal
    ? AbortSignal.any([callerSignal, timeoutSignal])
    : timeoutSignal;

  if (signal.aborted) return { ...empty };

  try {
    const details = songShape.safeParse(
      await catalogApi(endpoints.song.id, {
        query: { pids: id, type: "song" },
        signal,
      }),
    );
    const song = details.success ? details.data.songs[0] : undefined;
    if (song) {
      const info = song.more_info;
      const duration = Number(info.duration);
      const query: Query = {
        title: decode(song.title),
        artist:
          decode(info.artistMap?.primary_artists?.[0]?.name ?? "") ||
          decode(song.subtitle ?? ""),
        album: decode(info.album ?? ""),
        duration: Number.isFinite(duration) && duration > 0 ? duration : 0,
      };
      if (query.title && query.artist && !signal.aborted) {
        let match = await lookup(query, signal);
        const title = cleanTitle(query.title);
        if (!match && title && title !== query.title && !signal.aborted)
          match = await lookup({ ...query, title }, signal);
        if (match) {
          const lines = parseLrc(match.syncedLyrics ?? "");
          return {
            synced: lines.some((line) => line.text) ? lines : null,
            plain: match.plainLyrics?.trim() || null,
            instrumental: match.instrumental ?? false,
            source: "lrclib",
            copyright: null,
          };
        }
      }
    }
  } catch {
    // Lyrics are optional; a metadata outage must still allow the plain fallback.
  }
  if (!signal.aborted) {
    try {
      const plain = plainShape.safeParse(
        await catalogApi(endpoints.get.lyrics, {
          query: { lyrics_id: id },
          signal,
        }),
      );
      if (plain.success)
        return {
          ...empty,
          plain: plainText(plain.data.lyrics).trim() || null,
          copyright: plainText(plain.data.lyrics_copyright ?? "") || null,
        };
    } catch {
      // Both providers may have nothing or be temporarily unavailable.
    }
  }
  return { ...empty };
}
