import { getErrorCode } from "~/lib/error-code";
import { userMessage } from "~/lib/user-message";

/**
 * Next.js replaces the message of any error thrown by a server action with a
 * generic one in production and drops its fields, so the tRPC code cannot
 * cross the boundary on a rejection. Mutating actions return this instead and
 * the client calls `unwrap`, which rethrows an `Error` that `userMessage` maps.
 */
export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: string; message: string };

/** Server side: coded (tRPC) failures become a result; anything else rethrows. */
export async function toResult<T>(
  run: () => Promise<T>,
): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await run() };
  } catch (error) {
    const code = getErrorCode(error);
    if (code === undefined) throw error;
    return { ok: false, code, message: userMessage(error) };
  }
}

/** Client side: resolves with the data or rejects with a coded `Error`. */
export async function unwrap<T>(result: Promise<ActionResult<T>>): Promise<T> {
  const settled = await result;
  if (settled.ok) return settled.data;
  throw Object.assign(new Error(settled.message), { code: settled.code });
}
