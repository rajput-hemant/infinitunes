import { act } from "react";

/**
 * Polls `condition` (inside `act`, so React flushes between checks) until it
 * holds. Waits on the real condition rather than a fixed delay, so a loaded
 * machine only makes the test slower, never wrong.
 */
export async function waitFor(condition: () => boolean, timeoutMs = 5000) {
  const deadline = performance.now() + timeoutMs;
  while (!condition()) {
    if (performance.now() > deadline) {
      throw new Error(`waitFor: condition not met within ${timeoutMs}ms`);
    }
    await act(async () => new Promise((resolve) => setTimeout(resolve, 10)));
  }
}
