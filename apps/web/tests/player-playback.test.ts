import { describe, expect, it } from "bun:test";

const PLAYER = new URL("../components/player.tsx", import.meta.url);

// Reload and record-once behavior is covered by a rendered test:
// apps/web/tests/dom/track-playback.test.tsx
describe("player playback effects", () => {
  it("refetches radio refills past the app-wide Infinity staleTime", async () => {
    const source = await Bun.file(PLAYER).text();

    expect(source).toContain("{ staleTime: 0 }");
  });

  it("drives loading and history recording through useTrackPlayback", async () => {
    const source = await Bun.file(PLAYER).text();

    expect(source).toContain("useTrackPlayback({");
    expect(source).toContain("record: recordPlay");
  });
});
