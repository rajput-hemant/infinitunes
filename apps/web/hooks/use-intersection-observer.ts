import { useEffect, useRef, useState } from "react";

/**
 * Observes the element passed to the returned ref callback and calls
 * `onChange(true)` whenever at least `threshold` of it is visible. Returned as
 * a tuple so call sites can destructure `[ref]`.
 */
export function useIntersectionObserver({
  threshold = 0,
  onChange,
}: {
  threshold?: number;
  onChange: (isIntersecting: boolean) => void;
}) {
  const [node, setNode] = useState<Element | null>(null);
  const latest = useRef(onChange);

  useEffect(() => {
    latest.current = onChange;
  });

  useEffect(() => {
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          latest.current(
            entry.isIntersecting && entry.intersectionRatio >= threshold,
          );
        }
      },
      { threshold },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [node, threshold]);

  return [setNode] as const;
}
