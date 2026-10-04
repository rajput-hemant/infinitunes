import { useEffect, useRef } from "react";

/** Calls `handler` for every `keydown` on `window`, always with the latest closure. */
export function useKeydown(handler: (event: KeyboardEvent) => void) {
  const latest = useRef(handler);

  useEffect(() => {
    latest.current = handler;
  });

  useEffect(() => {
    const listener = (event: KeyboardEvent) => latest.current(event);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);
}
