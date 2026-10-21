function isObject(value: unknown): value is object {
  return typeof value === "object" && value !== null;
}

/**
 * The HTTP status of a tRPC client error whose response was not a tRPC error
 * at all: the web proxy's own 403 (origin) and 429 (rate limit) JSON, or a
 * gateway's HTML page. tRPC reports those as "Unable to transform response
 * from server", with the response in `meta` and no `data`.
 */
export function bareResponseStatus(error: unknown): number | undefined {
  if (!isObject(error)) return undefined;
  if ("data" in error && error.data != null) return undefined;
  if (!("meta" in error) || !isObject(error.meta)) return undefined;
  if (!("response" in error.meta) || !isObject(error.meta.response)) {
    return undefined;
  }
  const { response } = error.meta;
  return "status" in response && typeof response.status === "number"
    ? response.status
    : undefined;
}

/** The proxy answers these before tRPC runs; name them as tRPC would. */
const BARE_STATUS_CODES: Readonly<Record<number, string>> = {
  403: "FORBIDDEN",
  429: "TOO_MANY_REQUESTS",
};

export function getErrorCode(error: unknown): string | undefined {
  if (!isObject(error)) return undefined;
  if ("code" in error && typeof error.code === "string") return error.code;
  if (
    "data" in error &&
    isObject(error.data) &&
    "code" in error.data &&
    typeof error.data.code === "string"
  ) {
    return error.data.code;
  }
  const status = bareResponseStatus(error);
  return status === undefined ? undefined : BARE_STATUS_CODES[status];
}
