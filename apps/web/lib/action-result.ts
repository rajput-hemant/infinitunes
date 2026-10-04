import { getErrorCode } from "./error-code";
import { userMessage } from "./user-message";

/**
 * What a client-mutating server action returns. Thrown errors do not cross
 * the server-action boundary intact (production builds replace the message
 * with a digest), so actions return the code and the safe copy as data and
 * never throw coded errors. Read-only queries keep throwing: route error
 * boundaries and `orNotFound` depend on it.
 */
export type ActionResult<T> =
  | { ok: true; value: T }
  | { ok: false; code: string; message: string };

/** Runs an action body, mapping failures to an {@link ActionResult}. */
export async function actionResult<T>(
  run: () => Promise<T>,
): Promise<ActionResult<T>> {
  try {
    return { ok: true, value: await run() };
  } catch (error) {
    return {
      ok: false,
      code: getErrorCode(error) ?? "UNKNOWN",
      message: userMessage(error),
    };
  }
}

/**
 * Awaits an action result, resolving the value or throwing a coded `Error`
 * for the existing `error: userMessage` toast pattern. The message is the
 * server-chosen safe copy; user-caused codes stay readable, upstream and
 * internal failures stay generic.
 */
export async function unwrapAction<T>(
  result: Promise<ActionResult<T>>,
): Promise<T> {
  const settled = await result;
  if (!settled.ok) {
    throw Object.assign(new Error(settled.message), { code: settled.code });
  }
  return settled.value;
}
