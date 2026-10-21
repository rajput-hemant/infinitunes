/**
 * The HTTP status of a tRPC client error whose response was not a tRPC error
 * at all: the web proxy's own 403 (origin) and 429 (rate limit) JSON, or a
 * gateway's HTML page. tRPC reports those as "Unable to transform response
 * from server", with the response in `meta` and no `data`.
 */
export function bareResponseStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  if ("data" in error && error.data != null) return undefined;
  if (!("meta" in error) || typeof error.meta !== "object" || !error.meta) {
    return undefined;
  }
  const { response } = error.meta as { response?: unknown };
  if (typeof response !== "object" || response === null) return undefined;
  const { status } = response as { status?: unknown };
  return typeof status === "number" ? status : undefined;
}

export function getErrorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  if ("code" in error && typeof error.code === "string") return error.code;
  if (
    "data" in error &&
    typeof error.data === "object" &&
    error.data !== null &&
    "code" in error.data &&
    typeof error.data.code === "string"
  ) {
    return error.data.code;
  }
  // The proxy's limiter answers before tRPC does.
  if (bareResponseStatus(error) === 429) return "TOO_MANY_REQUESTS";
  return undefined;
}
