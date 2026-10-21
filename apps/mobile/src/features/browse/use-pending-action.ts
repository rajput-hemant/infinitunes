import { useState } from "react";

/**
 * Runs `action` at most once at a time and reports whether it is running, so a
 * button can disable itself while a play request is in flight. `action` must
 * handle its own failures (the play helpers toast them).
 */
export function usePendingAction(action: () => Promise<void>) {
  const [pending, setPending] = useState(false);

  async function run() {
    if (pending) return;
    setPending(true);
    try {
      await action();
    } finally {
      setPending(false);
    }
  }

  return { run, pending };
}
