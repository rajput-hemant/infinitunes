import { LANGUAGES } from "@infinitunes/types";
import { TRPCError } from "@trpc/server";

import { endpoints } from "./endpoints";

const BASE_URL = "https://www.jiosaavn.com/api.php";

const VALID_LANGUAGES = new Set<string>(LANGUAGES);

export function validLangs(langs: string | undefined): string {
  if (!langs) return "";
  return langs
    .split(",")
    .filter((l) => VALID_LANGUAGES.has(l.trim()))
    .map((l) => l.trim())
    .join(",");
}

export type ApiOptions = {
  isVersion4?: boolean;
  query?: Record<string, string | number | boolean | undefined>;
  language?: string;
  signal?: AbortSignal;
  /** Set false for randomized endpoints (e.g. radio batches) that must not be replayed from cache. */
  cache?: boolean;
  /** Per-attempt ceiling covering the response headers and the body read. */
  timeoutMs?: number;
};

/** Public catalog cache lifetimes in seconds; absent calls stay uncached. */
export const REVALIDATE_SECONDS: Readonly<Record<string, number>> = {
  [endpoints.modules.launch_data]: 600,
  [endpoints.get.charts]: 600,
  [endpoints.get.trending]: 600,
  [endpoints.get.featured_playlists]: 600,
  [endpoints.get.top_shows]: 600,
  [endpoints.get.top_artists]: 600,
  [endpoints.get.top_albums]: 600,
  [endpoints.get.mega_menu]: 3600,
  [endpoints.get.footer_details]: 3600,
  // Detail-by-link lookups (song/album/playlist/show/mix/label share this call).
  // Song payloads carry encrypted media URLs, so detail TTLs stay short.
  [endpoints.song.link]: 600,
  [endpoints.song.id]: 600,
  [endpoints.song.recommend]: 600,
  [endpoints.album.id]: 600,
  [endpoints.album.recommend]: 600,
  [endpoints.album.same_year]: 3600,
  [endpoints.playlist.id]: 600,
  [endpoints.playlist.recommend]: 600,
  [endpoints.artist.id]: 600,
  [endpoints.artist.songs]: 600,
  [endpoints.artist.albums]: 600,
  [endpoints.artist.top_songs]: 600,
  [endpoints.show.episodes]: 600,
  [endpoints.search.top_search]: 600,
  [endpoints.search.all]: 600,
  [endpoints.search.songs]: 600,
  [endpoints.search.albums]: 600,
  [endpoints.search.artists]: 600,
  [endpoints.search.playlists]: 600,
  [endpoints.search.more]: 600,
  [endpoints.get.actor_top_songs]: 600,
  [endpoints.get.featured_stations]: 600,
  [endpoints.get.lyrics]: 600,
};

/** TTL for catalog caching, or undefined when the call must not be cached. */
export function revalidateSeconds(
  call: string,
  useCache = true,
): number | undefined {
  return useCache ? REVALIDATE_SECONDS[call] : undefined;
}

const MAX_ATTEMPTS = 2;
const RETRY_DELAY_MS = 200;

function isAbortError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "name" in err &&
    err.name === "AbortError"
  );
}

/** Errors worth one more attempt: timeouts, network failures and 5xx. */
const transient = new WeakSet<TRPCError>();

/** True for timeouts, network failures and upstream 5xx; false for 4xx and bad bodies. */
export function isTransientUpstreamError(error: unknown): boolean {
  return error instanceof TRPCError && transient.has(error);
}

export function upstreamError(
  code: "TIMEOUT" | "BAD_GATEWAY",
  message: string,
  retryable: boolean,
): TRPCError {
  const error = new TRPCError({ code, message });
  if (retryable) transient.add(error);
  return error;
}

function fetchFailure(err: unknown): TRPCError {
  return isAbortError(err)
    ? upstreamError("TIMEOUT", "Upstream request timed out", true)
    : upstreamError("BAD_GATEWAY", "Upstream network failure", true);
}

/** One bounded attempt; the timeout also covers reading the body. */
async function attempt<T>(
  url: string,
  init: RequestInit,
  timeoutMs: number,
  callerSignal: AbortSignal | undefined,
  fetchFn: typeof fetch,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const signal = callerSignal
    ? AbortSignal.any([callerSignal, controller.signal])
    : controller.signal;
  try {
    let response: Response;
    try {
      response = await fetchFn(url, { ...init, signal });
    } catch (err) {
      throw fetchFailure(err);
    }

    if (!response.ok) {
      throw upstreamError(
        "BAD_GATEWAY",
        `Upstream returned ${response.status}`,
        response.status >= 500,
      );
    }

    try {
      return (await response.json()) as T;
    } catch (err) {
      if (isAbortError(err) || signal.aborted) {
        throw fetchFailure(err);
      }
      throw upstreamError(
        "BAD_GATEWAY",
        "Invalid JSON response from upstream",
        false,
      );
    }
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Calls the upstream JioSaavn API and returns the raw, untransformed JSON body.
 * Every call is a read-only GET, so a timeout, network error or 5xx is retried
 * once; 4xx and malformed bodies are not. A caller abort is never retried.
 * `T` names the shape the caller declares; the body is not validated.
 */
export async function api<T = unknown>(
  call: string,
  {
    isVersion4 = true,
    query = {},
    language,
    signal,
    timeoutMs = 10_000,
  }: ApiOptions = {},
  fetchFn: typeof fetch = fetch,
): Promise<T> {
  const params = new URLSearchParams({
    _format: "json",
    _marker: "0",
    ctx: "web6dot0",
    ...(isVersion4 ? { api_version: "4" } : {}),
  });

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, `${value}`);
  }

  const url = `${BASE_URL}?__call=${call}&${params.toString()}`;
  const langs = validLangs(language) || "hindi,english";
  const init: RequestInit = {
    headers: {
      cookie: `L=${langs}; gdpr_acceptance=true; DL=english`,
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    },
  };

  for (let n = 1; ; n++) {
    try {
      const data = await attempt<T>(url, init, timeoutMs, signal, fetchFn);
      return data;
    } catch (err) {
      const retry =
        n < MAX_ATTEMPTS &&
        !signal?.aborted &&
        err instanceof TRPCError &&
        transient.has(err);
      if (!retry) throw err;
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
}
