import { useCallback, useRef } from "react";

import { useIsomorphicLayoutEffect } from ".";

/** See: https://github.com/juliencrn/usehooks-ts/blob/master/src/useEventCallback/useEventCallback.ts */
export default function useEventCallback<Args extends unknown[], R>(
  fn: (...args: Args) => R
) {
  const ref = useRef<typeof fn>(() => {
    throw new Error("Cannot call an event handler while rendering.");
  });

  useIsomorphicLayoutEffect(() => {
    ref.current = fn;
  }, [fn]);

  return useCallback((...args: Args) => ref.current(...args), [ref]);
}
