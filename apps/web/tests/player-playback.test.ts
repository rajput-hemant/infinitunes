import { describe, expect, it } from "bun:test";

const PLAYER = new URL("../components/player.tsx", import.meta.url);

// Reload and record-once behavior is covered by a rendered test:
// apps/web/tests/dom/track-playback.test.tsx
describe("player playback effects", () => {
  it("fetches radio refills through the uncached vanilla client", async () => {
    const source = await Bun.file(PLAYER).text();

    expect(source).toContain("trpc.radio.songs.query");
    expect(source).not.toContain("useUtils");
  });

  // Loading and history recording through the player is covered by a rendered
  // test: apps/web/tests/dom/player-renders.test.tsx ("player track wiring").
});
