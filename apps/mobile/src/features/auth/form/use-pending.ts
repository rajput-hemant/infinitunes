import { useState } from "react";

/** Tracks one in-flight submit, so its button and fields can disable. */
export function usePending() {
  const [pending, setPending] = useState(false);

  function run(task: () => Promise<void>): Promise<void> {
    setPending(true);
    return task().finally(() => setPending(false));
  }

  return { pending, run };
}
