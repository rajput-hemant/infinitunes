import { describe, expect, it } from "bun:test";

const PLAYER = new URL("../components/player.tsx", import.meta.url);

describe("player playback effects", () => {
  it("reloads audio only when the resolved source changes, not on every queue change", async () => {
    const source = await Bun.file(PLAYER).text();

    // `load` destroys and recreates the Howl (restarting the track), so the
    // effect must not depend on the whole `queue` array.
    expect(source).toContain(
      "[audioSrc, hasCurrent, isPlayerInit, load, onEndHandler]",
    );
    expect(source).not.toContain(
      "[queue, streamQuality, currentIndex, isPlayerInit, load, onEndHandler]",
    );
  });

  it("refetches radio refills past the app-wide Infinity staleTime", async () => {
    const source = await Bun.file(PLAYER).text();

    expect(source).toContain("{ staleTime: 0 }");
  });

  it("records a play once per queue entry, after the empty-source guard", async () => {
    const source = await Bun.file(PLAYER).text();

    const guard = source.indexOf("This song can't be played right now.");
    const record = source.indexOf("void recordPlay({");
    expect(guard).toBeGreaterThan(-1);
    expect(record).toBeGreaterThan(guard);
    expect(source).toContain("lastRecordedRef.current !== track.queueItemId");
    expect(source).toContain('track.type === "episode" ? "episode" : "song"');
  });
});
