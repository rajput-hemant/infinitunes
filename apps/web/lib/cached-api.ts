import {
  api,
  type ApiOptions,
  isTransientUpstreamError,
  revalidateSeconds,
  upstreamError,
  validLangs,
} from "@infinitunes/trpc/api";
import { TRPCError } from "@trpc/server";
import { cacheLife, cacheTag } from "next/cache";

const ERROR_PREFIX = "catalog:";

type CatalogOptions = Pick<
  ApiOptions,
  "query" | "isVersion4" | "language" | "timeoutMs"
>;

async function catalogRequest(
  call: string,
  options: CatalogOptions,
  seconds: number,
) {
  "use cache";
  cacheLife({ stale: seconds, revalidate: seconds, expire: seconds });
  cacheTag("catalog", `catalog:${call}`);
  try {
    return await api(call, options);
  } catch (error) {
    // Next serializes errors across cache scopes; preserve the upstream classification.
    if (error instanceof TRPCError) {
      Object.assign(error, {
        digest:
          ERROR_PREFIX +
          JSON.stringify({
            code: error.code,
            message: error.message,
            transient: isTransientUpstreamError(error),
          }),
      });
    }
    throw error;
  }
}

export const cachedApi: typeof api = async <T = unknown>(
  call: string,
  options: ApiOptions = {},
  fetchFn?: typeof fetch,
): Promise<T> => {
  const seconds = revalidateSeconds(call, options.cache);
  if (seconds === undefined || options.signal || fetchFn) {
    return api<T>(call, options, fetchFn);
  }
  const normalized: CatalogOptions = {
    isVersion4: options.isVersion4 ?? true,
    language: validLangs(options.language) || "hindi,english",
    timeoutMs: options.timeoutMs ?? 10_000,
    query: Object.fromEntries(
      Object.entries(options.query ?? {})
        .filter(([, value]) => value !== undefined && value !== "")
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => [key, String(value)]),
    ),
  };
  try {
    return (await catalogRequest(call, normalized, seconds)) as T;
  } catch (error) {
    if (
      error instanceof Error &&
      "digest" in error &&
      typeof error.digest === "string" &&
      error.digest.startsWith(ERROR_PREFIX)
    ) {
      const detail: unknown = JSON.parse(
        error.digest.slice(ERROR_PREFIX.length),
      );
      if (
        typeof detail === "object" &&
        detail !== null &&
        "code" in detail &&
        (detail.code === "TIMEOUT" || detail.code === "BAD_GATEWAY") &&
        "message" in detail &&
        typeof detail.message === "string" &&
        "transient" in detail &&
        typeof detail.transient === "boolean"
      ) {
        throw upstreamError(detail.code, detail.message, detail.transient);
      }
    }
    throw error;
  }
};
