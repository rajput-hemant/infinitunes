import { useRef, useState } from "react";

/**
 * Tracks one in-flight task (a submit, a play request), so its controls can
 * disable; a run while one is pending is ignored. `task` handles its own
 * failures (toasts); the returned promise settles when it does.
 */
export function usePending() {
  const [pending, setPending] = useState(false);
  const running = useRef(false);

  function run(task: () => Promise<void>): Promise<void> {
    if (running.current) return Promise.resolve();
    running.current = true;
    setPending(true);
    return task().finally(() => {
      running.current = false;
      setPending(false);
    });
  }

  return { pending, run };
}
