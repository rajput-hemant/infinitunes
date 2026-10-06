import { getErrorCode } from "~/lib/error-code";
import { GENERIC_MESSAGE, userMessage } from "~/lib/user-message";

/**
 * Next.js replaces the message of any error thrown by a server action with a
 * generic one in production and drops its fields, so the tRPC code cannot
 * cross the boundary on a rejection. Mutating actions return this instead and
 * the client calls `unwrap`, which rethrows an `Error` that `userMessage` maps.
 */
export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: string; message: string };

/** Next.js control flow (`redirect`, `notFound`, ...) is thrown with a `digest` and must propagate. */
function isFrameworkSignal(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof error.digest === "string" &&
    /^(NEXT_|HTTP_ERROR_FALLBACK)/.test(error.digest)
  );
}

/**
 * Server side: failures become a result, with `UNKNOWN` and generic copy for
 * errors that carry no code (their message may be internal). Next.js control-flow signals rethrow so redirects keep working.
 */
export async function toResult<T>(
  run: () => Promise<T>,
): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await run() };
  } catch (error) {
    if (isFrameworkSignal(error)) throw error;
    const code = getErrorCode(error);
    return {
      ok: false,
      code: code ?? "UNKNOWN",
      message: code ? userMessage(error) : GENERIC_MESSAGE,
    };
  }
}

/** Client side: resolves with the data or rejects with a coded `Error`. */
export async function unwrap<T>(result: Promise<ActionResult<T>>): Promise<T> {
  const settled = await result;
  if (settled.ok) return settled.data;
  throw Object.assign(new Error(settled.message), { code: settled.code });
}
