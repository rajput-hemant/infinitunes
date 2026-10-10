/** A selector item's horizontal extent, from `offsetLeft` and `offsetWidth`. */
export type ItemSpan = { left: number; width: number };

/** Drag threshold (px) before a press becomes a drag. */
export const DRAG_START_PX = 8;

/** Where the indicator may sit while dragged: inside the first and last item. */
export function dragBounds(items: readonly ItemSpan[], indicatorWidth: number) {
  const first = items[0];
  const last = items[items.length - 1];
  return {
    min: first.left,
    max: last.left + last.width - indicatorWidth,
  };
}

/** Index of the item whose centre is nearest `x`. */
export function nearestItem(items: readonly ItemSpan[], x: number): number {
  let best = 0;
  items.forEach((item, i) => {
    const centre = item.left + item.width / 2;
    const bestCentre = items[best].left + items[best].width / 2;
    if (Math.abs(centre - x) < Math.abs(bestCentre - x)) best = i;
  });
  return best;
}

/** Velocity (px/s) from the first and last of the recent pointer samples. */
export function releaseVelocity(
  samples: readonly (readonly [x: number, time: number])[],
): number {
  const first = samples[0];
  const last = samples[samples.length - 1];
  if (!first || !last || last[1] <= first[1]) return 0;
  return ((last[0] - first[0]) / (last[1] - first[1])) * 1000;
}
