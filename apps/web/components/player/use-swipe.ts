import * as React from "react";

type SwipeOptions = {
  direction: "up" | "down";
  /** Pixels the touch must travel in `direction` to count as a swipe. */
  distance: number;
  onSwipe: () => void;
};

/** Touch handlers that fire `onSwipe` for a vertical swipe past `distance`. */
export function useSwipe({ direction, distance, onSwipe }: SwipeOptions) {
  const startY = React.useRef<number | null>(null);

  return {
    onTouchStart(event: React.TouchEvent) {
      startY.current = event.touches[0]?.clientY ?? null;
    },
    onTouchEnd(event: React.TouchEvent) {
      const start = startY.current;
      if (start !== null) {
        const end = event.changedTouches[0]?.clientY ?? 0;
        const travel = direction === "up" ? start - end : end - start;
        if (travel > distance) onSwipe();
      }
      startY.current = null;
    },
  };
}
