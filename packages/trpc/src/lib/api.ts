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

/**
 * Next Data Cache TTLs (seconds) for public catalog calls, keyed by upstream
 * `__call`. Anything absent is never cached by Next: search/autocomplete,
 * lyrics, radio (`webradio.*`, randomized) and anything user specific. The
 * cache key is URL + request headers, and the only header that varies is the
 * language cookie, so it never depends on the visitor's session.
 */
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
};

/** TTL for the Next Data Cache, or undefined when the call must not be cached. */
export function revalidateSeconds(
  call: string,
  useCache = true,
): number | undefined {
  return useCache ? REVALIDATE_SECONDS[call] : undefined;
}

const MAX_ATTEMPTS = 2;
const RETRY_DELAY_MS = 200;

const CACHE_TTL = 60_000;

/** Hard ceiling on cached upstream responses; oldest entries are evicted first. */
export const CACHE_MAX_ENTRIES = 500;

type CacheEntry = { expires: number; data: unknown };

/** Insertion order doubles as LRU recency: re-reads move a key to the end. */
const cache = new Map<string, CacheEntry>();

function cacheGet(key: string): CacheEntry | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (entry.expires <= Date.now()) {
    cache.delete(key);
    return undefined;
  }
  cache.delete(key);
  cache.set(key, entry);
  return entry;
}

function cacheSet(key: string, data: unknown): void {
  cache.delete(key);
  cache.set(key, { expires: Date.now() + CACHE_TTL, data });
  while (cache.size > CACHE_MAX_ENTRIES) {
    const oldest = cache.keys().next();
    if (oldest.done) break;
    cache.delete(oldest.value);
  }
}

/** Test/ops helpers for the module-level cache. */
export function apiCacheSize(): number {
  return cache.size;
}

export function clearApiCache(): void {
  cache.clear();
}

type CombinedSignal = { signal: AbortSignal; release: () => void };

function combineSignals(
  timeoutSignal: AbortSignal,
  callerSignal: AbortSignal | undefined,
): CombinedSignal {
  if (!callerSignal) return { signal: timeoutSignal, release: () => {} };
  if (typeof AbortSignal.any === "function") {
    return {
      signal: AbortSignal.any([callerSignal, timeoutSignal]),
      release: () => {},
    };
  }

  const controller = new AbortController();
  const signals = [callerSignal, timeoutSignal];
  const onAbort = (event: Event) => {
    controller.abort((event.target as AbortSignal).reason);
  };
  const already = signals.find((s) => s.aborted);
  if (already) {
    controller.abort(already.reason);
    return { signal: controller.signal, release: () => {} };
  }
  for (const s of signals) s.addEventListener("abort", onAbort, { once: true });
  return {
    signal: controller.signal,
    release: () => {
      for (const s of signals) s.removeEventListener("abort", onAbort);
    },
  };
}

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

function upstreamError(
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

type NextFetchInit = RequestInit & { next?: { revalidate: number } };

/** One bounded attempt; the timeout also covers reading the body. */
async function attempt<T>(
  url: string,
  init: NextFetchInit,
  timeoutMs: number,
  callerSignal: AbortSignal | undefined,
  fetchFn: typeof fetch,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const combined = combineSignals(controller.signal, callerSignal);
  try {
    let response: Response;
    try {
      response = await fetchFn(url, { ...init, signal: combined.signal });
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
      if (isAbortError(err) || combined.signal.aborted) {
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
    combined.release();
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
    cache: useCache = true,
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
  const cacheKey = `${url}&L=${langs}`;

  const cached = useCache ? cacheGet(cacheKey) : undefined;
  if (cached) {
    return cached.data as T;
  }

  const revalidate = revalidateSeconds(call, useCache);
  const init: NextFetchInit = {
    headers: {
      cookie: `L=${langs}; gdpr_acceptance=true; DL=english`,
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    },
    ...(revalidate !== undefined ? { next: { revalidate } } : {}),
  };

  for (let n = 1; ; n++) {
    try {
      const data = await attempt<T>(url, init, timeoutMs, signal, fetchFn);
      if (useCache) cacheSet(cacheKey, data);
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
