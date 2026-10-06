import { describe, expect, it } from "bun:test";

const ROOT_LAYOUT = new URL("../app/(root)/layout.tsx", import.meta.url);
const PLAYER_WRAPPER = new URL(
  "../components/player-wrapper.tsx",
  import.meta.url,
);

describe("playerbar favorite-state and Add-label plumbing regression", () => {
  it("root layout fetches getUserFavorites and passes favorites to PlayerWrapper", async () => {
    const source = await Bun.file(ROOT_LAYOUT).text();

    expect(source).toContain("getUserFavorites");
    expect(source).toContain("getUserFavorites()");
    expect(source).toContain("favorites={userFavorites}");
  });

  it("player-wrapper accepts favorites prop and passes it to Player", async () => {
    const source = await Bun.file(PLAYER_WRAPPER).text();

    expect(source).toContain("favorites?: Favorite | null;");
    expect(source).toContain("favorites={favorites}");
  });

  // The player-to-TileMoreButton favorites forwarding is covered by a rendered
  // test: apps/web/tests/dom/player-renders.test.tsx ("player favorite
  // plumbing"). The more-button's own favorite state is covered by
  // apps/web/tests/dom/favorite-state.test.tsx
});

describe("player a11y labels", () => {
  // Slider labelling and the empty-state More name are covered by rendered
  // tests: apps/web/tests/dom/player-renders.test.tsx ("player a11y").
});
