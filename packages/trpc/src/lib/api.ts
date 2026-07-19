import { TRPCError } from "@trpc/server";

const BASE_URL = "https://www.jiosaavn.com/api.php";

const VALID_LANGUAGES = new Set([
  "hindi",
  "english",
  "punjabi",
  "tamil",
  "telugu",
  "marathi",
  "gujarati",
  "bengali",
  "kannada",
  "bhojpuri",
  "malayalam",
  "urdu",
  "haryanvi",
  "rajasthani",
  "odia",
  "assamese",
]);

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

/**
 * Calls the upstream JioSaavn API and returns the raw, untransformed JSON body.
 */
export async function api<T = unknown>(
  call: string,
  { isVersion4 = true, query = {}, language, signal }: ApiOptions = {},
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

  let response: Response;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    const combinedSignal = signal
      ? (AbortSignal.any?.([signal, controller.signal]) ?? signal)
      : controller.signal;

    response = await fetch(url, {
      headers: {
        cookie: `L=${langs}; gdpr_acceptance=true; DL=english`,
      },
      signal: combinedSignal,
    });

    clearTimeout(timeout);
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
  }

  if (!response.ok) {
    throw new TRPCError({
      code: "BAD_GATEWAY",
      message: `Upstream returned ${response.status}`,
    });
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new TRPCError({
      code: "BAD_GATEWAY",
      message: "Invalid JSON response from upstream",
    });
  }
}
