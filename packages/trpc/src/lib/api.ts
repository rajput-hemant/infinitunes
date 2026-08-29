import { LANGUAGES, type Lang } from "@infinitunes/types";
import { TRPCError } from "@trpc/server";

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
};

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

/**
 * Calls the upstream JioSaavn API and returns the raw, untransformed JSON body.
 */
export async function api<T = unknown>(
  call: string,
  { isVersion4 = true, query = {}, language, signal }: ApiOptions = {},
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

  const cached = cacheGet(cacheKey);
  if (cached) {
    return cached.data as T;
  }

  let response: Response;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  const combined = combineSignals(controller.signal, signal);
  try {
    response = await fetchFn(url, {
      headers: {
        cookie: `L=${langs}; gdpr_acceptance=true; DL=english`,
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      },
      signal: combined.signal,
    });
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      throw new TRPCError({
        code: "TIMEOUT",
        message: "Upstream request timed out",
      });
    }
    throw new TRPCError({
      code: "BAD_GATEWAY",
      message: `Upstream network failure: ${(err as Error).message}`,
    });
  } finally {
    clearTimeout(timeout);
    combined.release();
  }

  if (!response.ok) {
    throw new TRPCError({
      code: "BAD_GATEWAY",
      message: `Upstream returned ${response.status}`,
    });
  }

  try {
    const data = (await response.json()) as T;
    cacheSet(cacheKey, data);
    return data;
  } catch {
    throw new TRPCError({
      code: "BAD_GATEWAY",
      message: "Invalid JSON response from upstream",
    });
  }
}
