export type LyricLine = { time: number; text: string };

/** A positive LRC offset advances lyrics, so subtract it from the timestamps. */
export function parseLrc(lrc: string): LyricLine[] {
  const offset =
    Number(/\[offset:\s*([+-]?\d+)\s*\]/i.exec(lrc)?.[1] ?? 0) / 1000;
  const lines: LyricLine[] = [];
  for (const row of lrc.split(/\r?\n/)) {
    const stamps = [...row.matchAll(/\[(\d+):([0-5]\d)(?:\.(\d{1,3}))?\]/g)];
    if (!stamps.length) continue;
    const text = row.replace(/\[\d+:[0-5]\d(?:\.\d{1,3})?\]/g, "").trim();
    for (const stamp of stamps) {
      const time =
        Number(stamp[1]) * 60 +
        Number(stamp[2]) +
        Number(`0.${stamp[3] ?? 0}`) -
        offset;
      if (Number.isFinite(time)) lines.push({ time: Math.max(0, time), text });
    }
  }
  return lines.sort((a, b) => a.time - b.time);
}

/** Last timestamp at or before the playhead; -1 before the first line. */
export function activeLineIndex(
  lines: readonly LyricLine[],
  positionSec: number,
): number {
  if (!Number.isFinite(positionSec)) return -1;
  let low = 0;
  let high = lines.length;
  while (low < high) {
    const mid = (low + high) >>> 1;
    const line = lines[mid];
    if (line && line.time <= positionSec) low = mid + 1;
    else high = mid;
  }
  return low - 1;
}
